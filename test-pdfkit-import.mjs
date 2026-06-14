const run = async () => {
    const pkg = await import('pdfkit');
    console.log("pkg:", Object.keys(pkg));
    console.log("pkg.default:", pkg.default);
};
run();
