Flexible editor API tests; isolated data only.
Elmekawy Motion Studio: http://127.0.0.1:50014
Error: ENOENT: no such file or directory, copyfile 'D:\zz-CODING\Elmekawy-Motion-Studio\.studio\test-runs\flexible-editor-2b9ff041-4919-4804-8fb7-34a3419ad751\.studio\staging\93adc1da-08a2-4206-ab30-19bce77235d6.upload' -> 'D:\zz-CODING\Elmekawy-Motion-Studio\.studio\test-runs\flexible-editor-2b9ff041-4919-4804-8fb7-34a3419ad751\flexible-projects\0--adfc40ca3d004a2bb3b472faff0a9cf2\assets\images\image-c4e9e3c3311749ffbf9a67b0cedca7ca.png'
    at async Object.copyFile (node:internal/fs/promises:679:10)
    at async file:///D:/zz-CODING/Elmekawy-Motion-Studio/apps/server/src/flexible-media.ts:78:7
    at async withLock (file:///D:/zz-CODING/Elmekawy-Motion-Studio/apps/server/src/storage.ts:40:252)
    at async Object.<anonymous> (file:///D:/zz-CODING/Elmekawy-Motion-Studio/apps/server/src/flexible-routes.ts:117:131) {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'copyfile',
  path: 'D:\\zz-CODING\\Elmekawy-Motion-Studio\\.studio\\test-runs\\flexible-editor-2b9ff041-4919-4804-8fb7-34a3419ad751\\.studio\\staging\\93adc1da-08a2-4206-ab30-19bce77235d6.upload',
  dest: 'D:\\zz-CODING\\Elmekawy-Motion-Studio\\.studio\\test-runs\\flexible-editor-2b9ff041-4919-4804-8fb7-34a3419ad751\\flexible-projects\\0--adfc40ca3d004a2bb3b472faff0a9cf2\\assets\\images\\image-c4e9e3c3311749ffbf9a67b0cedca7ca.png'
}
