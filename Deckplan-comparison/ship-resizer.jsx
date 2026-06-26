#target photoshop

app.bringToFront();

(function () {

    var FINAL_W = 1518;
    var FINAL_H = 244;

    // Max artwork size after trimming/scaling
    var ART_MAX_W = 1510;
    var ART_MAX_H = 206;

    // Set to true if you want small artwork enlarged
    var UPSCALE = true;

    var inputFolder = Folder.selectDialog("Select folder of images to process");
    if (!inputFolder) return;

    var outputFolder = Folder.selectDialog("Select folder to save transparent PNGs");
    if (!outputFolder) return;

    var files = inputFolder.getFiles(function (f) {
        return f instanceof File && /\.(png|jpg|jpeg|tif|tiff|psd|psb)$/i.test(f.name);
    });

    if (!files.length) {
        alert("No supported image files found.");
        return;
    }

    var originalRulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    for (var i = 0; i < files.length; i++) {
        try {
            var doc = app.open(files[i]);

            // Ensure transparency-capable document
            if (doc.mode !== DocumentMode.RGB) {
                doc.changeMode(ChangeMode.RGB);
            }

            // Trim transparent pixels to artwork bounds
            doc.trim(TrimType.TRANSPARENT, true, true, true, true);

            var currentW = doc.width.as("px");
            var currentH = doc.height.as("px");

            // Scale artwork proportionally to fit within max artwork bounds
            var scaleByWidth = ART_MAX_W / currentW;
            var scaleByHeight = ART_MAX_H / currentH;
            var scale = Math.min(scaleByWidth, scaleByHeight);

            if (!UPSCALE) {
                scale = Math.min(scale, 1);
            }

            var newW = Math.round(currentW * scale);
            var newH = Math.round(currentH * scale);

            doc.resizeImage(
                UnitValue(newW, "px"),
                UnitValue(newH, "px"),
                undefined,
                ResampleMethod.BICUBIC
            );

            // Center artwork on final transparent canvas
            doc.resizeCanvas(
                UnitValue(FINAL_W, "px"),
                UnitValue(FINAL_H, "px"),
                AnchorPosition.MIDDLECENTER
            );

            var baseName = decodeURI(files[i].name).replace(/\.[^\.]+$/, "");
            var saveFile = new File(outputFolder.fsName + "/" + baseName + ".png");

            var pngOptions = new PNGSaveOptions();
            pngOptions.interlaced = false;

            doc.saveAs(saveFile, pngOptions, true, Extension.LOWERCASE);
            doc.close(SaveOptions.DONOTSAVECHANGES);

        } catch (e) {
            try {
                if (app.documents.length) {
                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
                }
            } catch (_) {}

            alert("Error processing:\n" + files[i].name + "\n\n" + e.message);
        }
    }

    app.preferences.rulerUnits = originalRulerUnits;

    alert("Done processing " + files.length + " images.");

})();