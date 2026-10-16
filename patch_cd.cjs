const fs = require('fs');
let content = fs.readFileSync('pages/CustomerDisplay.tsx', 'utf8');

const targetContent = `  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [ads]);`;

const newContent = `  useEffect(() => {
    if (ads.length <= 1) return;
    const intervalSeconds = store.settings?.customerDisplay_sliderInterval || 5;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [ads, store.settings?.customerDisplay_sliderInterval]);`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, newContent);
  fs.writeFileSync('pages/CustomerDisplay.tsx', content);
  console.log("CustomerDisplay.tsx patched");
} else {
  console.log("Could not find target content in CustomerDisplay.tsx");
}
