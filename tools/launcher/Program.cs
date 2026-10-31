using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: AssemblyTitle("Elmekawy Motion Studio Launcher")]
[assembly: AssemblyDescription("Start the local Studio and open its browser interface")]
[assembly: AssemblyVersion("0.1.0.0")]
[assembly: AssemblyFileVersion("0.1.0.0")]

internal static class Program
{
    internal const string Title = "Elmekawy Motion Studio";
    internal static readonly string Root = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    private static readonly object LogGate = new object();
    private static string logPath;

    [STAThread]
    private static int Main(string[] args)
    {
        bool headless = Array.IndexOf(args, "--headless") >= 0;
        bool check = Array.IndexOf(args, "--check") >= 0;
        Process owned = null;
        Mutex mutex = null;
        bool locked = false;
        try
        {
            if (headless || check)
                Console.SetOut(new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false)) {AutoFlush = true});
            int port = 4311;
            string dataRoot = Root;
            foreach (string arg in args)
            {
                if (arg == "--headless" || arg == "--check") continue;
                if (headless && arg.StartsWith("--port=", StringComparison.Ordinal))
                {
                    if (!Int32.TryParse(arg.Substring(7), out port) || port < 1024 || port > 65535)
                        throw new Exception("Invalid diagnostic port.");
                }
                else if (headless && arg.StartsWith("--data-root=", StringComparison.Ordinal))
                {
                    dataRoot = Path.GetFullPath(arg.Substring(12));
                    string tests = Path.Combine(Root, ".studio", "test-runs") + Path.DirectorySeparatorChar;
                    if (!dataRoot.StartsWith(tests, StringComparison.OrdinalIgnoreCase))
                        throw new Exception("Diagnostic data must stay inside .studio/test-runs.");
                }
                else throw new Exception("Unknown launcher argument: " + arg);
            }
            if (headless && port != 4311 && dataRoot == Root)
                throw new Exception("A diagnostic port requires an isolated test store.");

            string url = "http://127.0.0.1:" + port;
            CheckProjectRoot();
            if (check)
            {
                string node = Preflight();
                Report(new {status = "ready", node = node, root = Root});
                return 0;
            }
            mutex = new Mutex(false, MutexName(dataRoot, port));
            try { locked = mutex.WaitOne(0); }
            catch (AbandonedMutexException) { locked = true; }
            if (!locked)
            {
                if (!WaitHealthy(url, null, dataRoot, port, 30000))
                    throw new Exception("الاستوديو قيد التشغيل، لكن لم يكتمل تحميله. حاول مرة أخرى بعد لحظات.");
                if (headless) Report(new {status = "reused", url = url, owned = false});
                else OpenBrowser(url);
                return 0;
            }
            if (Healthy(url) && StoreIsServing(dataRoot, port, null))
            {
                if (headless) Report(new {status = "reused", url = url, owned = false});
                else OpenBrowser(url);
                return 0;
            }
            if (PortBusy(port))
                throw new Exception("المنفذ " + port + " مستخدم بواسطة برنامج آخر. لم يتم إيقاف أي برنامج.");
            CheckStoreOwner(dataRoot);
            string executable = Preflight();
            string logs = Path.Combine(dataRoot, ".studio", "launcher");
            Directory.CreateDirectory(logs);
            logPath = Path.Combine(logs, "server-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss-fff") + ".log");
            File.WriteAllText(logPath, "Studio launcher " + DateTime.UtcNow.ToString("o") + Environment.NewLine, new UTF8Encoding(false));
            ProcessStartInfo start = new ProcessStartInfo(executable);
            start.Arguments = "\"" + Path.Combine(Root, "scripts", "launcher-host.mjs") + "\"";
            start.WorkingDirectory = Root;
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.WindowStyle = ProcessWindowStyle.Hidden;
            start.RedirectStandardInput = true;
            start.RedirectStandardOutput = true;
            start.RedirectStandardError = true;
            start.EnvironmentVariables["STUDIO_PORT"] = port.ToString();
            start.EnvironmentVariables["STUDIO_DATA_ROOT"] = dataRoot;
            owned = new Process {StartInfo = start};
            owned.OutputDataReceived += delegate(object sender, DataReceivedEventArgs e) { Log(e.Data); };
            owned.ErrorDataReceived += delegate(object sender, DataReceivedEventArgs e) { Log(e.Data); };
            if (!owned.Start()) throw new Exception("تعذر تشغيل خادم الاستوديو.");
            owned.BeginOutputReadLine();
            owned.BeginErrorReadLine();
            if (!WaitHealthy(url, owned, dataRoot, port, 30000))
                throw new Exception("تعذر بدء الاستوديو. تفاصيل الخطأ محفوظة في:\n" + logPath);
            if (headless)
            {
                Report(new {status = "started", url = url, owned = true, pid = owned.Id});
                Console.ReadLine(); // Diagnostic controller requests stop; EOF also stops its server.
                StopOwned(owned);
                Report(new {status = "stopped"});
                return 0;
            }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            using (StudioContext context = new StudioContext(owned, url))
            {
                OpenBrowser(url);
                Application.Run(context);
            }
            return 0;
        }
        catch (Exception error)
        {
            if (owned != null) { try { StopOwned(owned); } catch (Exception stopError) { Log(stopError.Message); } }
            Log(error.ToString());
            if (headless || check) Report(new {status = "error", message = error.Message});
            else MessageBox.Show(error.Message, Title, MessageBoxButtons.OK, MessageBoxIcon.Error,
                MessageBoxDefaultButton.Button1, MessageBoxOptions.RightAlign | MessageBoxOptions.RtlReading);
            return 1;
        }
        finally
        {
            if (owned != null) owned.Dispose();
            if (locked && mutex != null) mutex.ReleaseMutex();
            if (mutex != null) mutex.Dispose();
        }
    }

    private static void Report(object value) { Console.WriteLine(Json.Serialize(value)); }

    private static string MutexName(string dataRoot, int port)
    {
        using (SHA256 sha = SHA256.Create())
        {
            byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(dataRoot.ToLowerInvariant() + ":" + port));
            return "Local\\ElmekawyMotionStudio-" + BitConverter.ToString(hash).Replace("-", "");
        }
    }

    private static void CheckProjectRoot()
    {
        foreach (string relative in new [] {"package.json", "apps/server/src/index.ts", "scripts/launcher-host.mjs"})
            if (!File.Exists(Path.Combine(Root, relative)))
                throw new Exception("ضع ملف EXE داخل مجلد Elmekawy Motion Studio نفسه. لفتحه من سطح المكتب أنشئ اختصارًا للملف.");
    }

    private static string Preflight()
    {
        CheckProjectRoot();
        if (!File.Exists(Path.Combine(Root, "node_modules", "fastify", "package.json")) ||
            !File.Exists(Path.Combine(Root, "apps", "studio", "dist", "index.html")) ||
            !File.Exists(Path.Combine(Root, "shared-assets", "catalog.json")))
            throw new Exception("المشروع يحتاج التجهيز الأولي الموضح في README: تثبيت الحزم ثم seed ثم build.");
        string browser = Path.Combine(Root, "node_modules", ".remotion", "chrome-headless-shell", "win64", "chrome-headless-shell-win64", "chrome-headless-shell.exe");
        if (!File.Exists(browser) || new FileInfo(browser).Length < 1024 * 1024)
            throw new Exception("متصفح التصيير المحلي غير مجهز. استكمل Git LFS ثم npm.cmd run seed حسب README.");
        string node = FindNode();
        ProcessStartInfo check = new ProcessStartInfo(node, "-p \"process.versions.node.split('.')[0]\"");
        check.UseShellExecute = false;
        check.CreateNoWindow = true;
        check.WindowStyle = ProcessWindowStyle.Hidden;
        check.RedirectStandardOutput = true;
        check.RedirectStandardError = true;
        using (Process process = Process.Start(check))
        {
            if (!process.WaitForExit(5000)) { process.Kill(); throw new Exception("تعذر التحقق من Node.js."); }
            int version;
            if (process.ExitCode != 0 || !Int32.TryParse(process.StandardOutput.ReadToEnd().Trim(), out version) || version < 24)
                throw new Exception("يلزم تثبيت Node.js 24 أو أحدث لتشغيل الاستوديو.");
        }
        return node;
    }

    private static string FindNode()
    {
        List<string> folders = new List<string>();
        folders.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs"));
        folders.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs"));
        folders.AddRange((Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator));
        foreach (string folder in folders)
        {
            if (String.IsNullOrWhiteSpace(folder)) continue;
            string file = Path.Combine(Environment.ExpandEnvironmentVariables(folder.Trim().Trim('"')), "node.exe");
            if (File.Exists(file)) return file;
        }
        throw new Exception("Node.js غير موجود. ثبّت Node.js 24 أو أحدث ثم افتح الاستوديو مرة أخرى.");
    }

    private static void CheckStoreOwner(string dataRoot)
    {
        string file = Path.Combine(dataRoot, ".studio", "server.lock");
        if (!File.Exists(file)) return;
        Dictionary<string, object> owner = Json.Deserialize<Dictionary<string, object>>(File.ReadAllText(file));
        int pid = Convert.ToInt32(owner["pid"]);
        bool alive;
        try { using (Process process = Process.GetProcessById(pid)) { alive = !process.HasExited; } }
        catch (ArgumentException) { alive = false; }
        if (alive) throw new Exception("يوجد خادم آخر يستخدم بيانات الاستوديو، ربما نسخة التطوير. أغلقه ثم افتح ملف EXE.");
    }

    private static bool PortBusy(int port)
    {
        try { using (TcpClient client = new TcpClient()) { return client.ConnectAsync("127.0.0.1", port).Wait(500); } }
        catch { return false; }
    }

    private static bool Healthy(string url)
    {
        try
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url + "/api/health");
            request.Proxy = null;
            request.AllowAutoRedirect = false;
            request.Timeout = 500;
            request.ReadWriteTimeout = 500;
            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (StreamReader reader = new StreamReader(response.GetResponseStream()))
            {
                if (response.StatusCode != HttpStatusCode.OK) return false;
                Dictionary<string, object> health = new JavaScriptSerializer().Deserialize<Dictionary<string, object>>(reader.ReadToEnd());
                return health.ContainsKey("ok") && Object.Equals(health["ok"], true) &&
                    health.ContainsKey("mode") && Object.Equals(health["mode"], "local") &&
                    health.ContainsKey("remotion") && Object.Equals(health["remotion"], "4.0.539");
            }
        }
        catch { return false; }
    }

    private static bool StoreIsServing(string dataRoot, int port, Process child)
    {
        try
        {
            Dictionary<string, object> owner = Json.Deserialize<Dictionary<string, object>>(File.ReadAllText(Path.Combine(dataRoot, ".studio", "server.lock")));
            int pid = Convert.ToInt32(owner["pid"]);
            if (Convert.ToInt32(owner["port"]) != port || (child != null && child.Id != pid)) return false;
            using (Process process = Process.GetProcessById(pid)) { return !process.HasExited; }
        }
        catch { return false; }
    }

    private static bool WaitHealthy(string url, Process child, string dataRoot, int port, int timeout)
    {
        Stopwatch timer = Stopwatch.StartNew();
        while (timer.ElapsedMilliseconds < timeout)
        {
            if (child != null && child.HasExited) return false;
            if (Healthy(url) && StoreIsServing(dataRoot, port, child)) return true;
            Thread.Sleep(150);
        }
        return false;
    }

    internal static void OpenBrowser(string url)
    {
        Process.Start(new ProcessStartInfo(url + "/") {UseShellExecute = true});
    }

    internal static void StopOwned(Process child)
    {
        if (child.HasExited) return;
        child.StandardInput.WriteLine("shutdown");
        child.StandardInput.Flush();
        if (!child.WaitForExit(15000))
            throw new Exception("الخادم لم يكتمل إيقافه بعد. انتظر قليلًا ثم حاول مرة أخرى.\n" + logPath);
        child.WaitForExit();
    }

    private static void Log(string line)
    {
        if (line == null || logPath == null) return;
        lock (LogGate) { try { File.AppendAllText(logPath, line + Environment.NewLine, new UTF8Encoding(false)); } catch { } }
    }

    private sealed class StudioContext : ApplicationContext
    {
        private readonly NotifyIcon tray;
        private readonly Process child;
        private readonly System.Windows.Forms.Timer timer;
        private readonly ToolStripMenuItem stop;
        private bool exiting;

        internal StudioContext(Process process, string url)
        {
            child = process;
            ContextMenuStrip menu = new ContextMenuStrip();
            menu.RightToLeft = RightToLeft.Yes;
            menu.Items.Add("فتح الاستوديو", null, delegate { TryOpen(url); });
            stop = new ToolStripMenuItem("إيقاف الاستوديو والتصدير الجاري", null, delegate { Stop(); });
            menu.Items.Add(stop);
            tray = new NotifyIcon {Text = Title, Icon = SystemIcons.Application, ContextMenuStrip = menu, Visible = true};
            tray.DoubleClick += delegate { TryOpen(url); };
            timer = new System.Windows.Forms.Timer {Interval = 1000};
            timer.Tick += delegate { if (!exiting && child.HasExited) { exiting = true; tray.Visible = false; ExitThread(); } };
            timer.Start();
        }

        private void TryOpen(string url)
        {
            try { OpenBrowser(url); }
            catch (Exception error) { MessageBox.Show(error.Message, Title, MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        private void Stop()
        {
            if (exiting) return;
            stop.Enabled = false;
            try { StopOwned(child); exiting = true; tray.Visible = false; ExitThread(); }
            catch (Exception error) { stop.Enabled = true; MessageBox.Show(error.Message, Title, MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) { timer.Dispose(); tray.Visible = false; tray.ContextMenuStrip.Dispose(); tray.Dispose(); }
            base.Dispose(disposing);
        }
    }
}
