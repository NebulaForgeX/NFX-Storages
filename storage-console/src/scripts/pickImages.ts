// ✅ 用户激活版文件选择器 — 不会被浏览器禁用
export function pickImagesWithUserGesture(): Promise<File[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.style.display = "none";
  
      input.onchange = () => {
        resolve(input.files ? Array.from(input.files) : null);
        document.body.removeChild(input);
      };
  
      document.body.appendChild(input);
  
      // ✅ 浏览器允许：同步在点击事件里调用
      input.click();
    });
  }
  