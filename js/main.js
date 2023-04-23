$(function() {

    /**
     * グローバルな変数を定義
     */
    const dropzone = $("#dropzone");

    const cvs = $("#main-canvas");
    const ctx = cvs[0].getContext("2d");

    let scale = 1;
    let img;

    let contrast = 8;
    let threshold = 80;

    

    /**
     * キャンバスとページの座標を変換
     * @param {number} val 変換する座標
     * @param {string} axis 座標の軸 x or y
     * @param {boolean} scale 拡大縮小の有無
     * @returns 変換した座標
     */
    function cvsToPage(val, axis, scale) {
        return val * (scale / (scale?1:scale)) + cvs.offset()[axis=="x"?"left":"top"];
    }
    function pageToCvs(val, axis, scale) {
        return (val - cvs.offset()[axis=="x"?"left":"top"]) / (scale / (scale?1:scale));
    }


    
    /**
     * ドラッグオーバー時に背景色を変更
     */
    dropzone.on("dragover", function(e) {
        e.preventDefault();
        $(this).addClass("dragover");
    });
    dropzone.on("dragleave", function(e) {
        e.preventDefault();
        $(this).removeClass("dragover");
    });



    /**
     * ドロップされた画像を読み込む
     */
    dropzone.on("drop", function(e){
        // デフォルトイベントを取り消し
        e.preventDefault();

        // ドロップされたファイルを取得
        readImageFile(e.originalEvent.dataTransfer.files[0]);

        // 背景色を戻す
        dropzone.removeClass("dragover");
    });

    /**
     * 選択された画像を読み込む
     *  */
    $("#image-loader").on("change", function(e) {
        readImageFile(e.target.files[0]);
    });



    /**
     * イベントから渡された画像を表示
     *  */
    function readImageFile(file) {
        // キャンバスに画面切り替え
        $("#image-loader-container").addClass("hidden");
        $("#editor-container").removeClass("hidden");

        // FileReaderを使用して、画像を読み込む
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = function(e) {
            // 画像を読み込み
            img = new Image();
            img.src = e.target.result;

            img.onload = function() {
                // キャンバスをリサイズ
                cvs.attr("width", img.width);
                cvs.attr("height", img.height);

                // キャンバスに画像を描画
                fitCnavasToWindow();
                refreshFrame();
            }
        }
    }



    /**
     * ウィンドウリサイズ時にキャンバスを再描画
     */
    $(window).resize(function(e) {
        fitCnavasToWindow();
    })



    /**
     * コントラストを調整
     */
    $("#contrast").on("change", function() {
        contrast = $(this).val();
        refreshFrame();
    });

    /**
     * しきい値を調整
     */
    $("#threshold").on("change", function() {
        threshold = $(this).val();
        refreshFrame();
    });



    /**
     * キャンバスを再描画
     */
    function refreshFrame() {
        // 画像を描画
        ctx.clearRect(0, 0, cvs.width(), cvs.height());
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // 画像の色データを取得
        let pxs = ctx.getImageData(0, 0, img.width, img.height);

        // びぶん
        for (i = 0; i < pxs.data.length/4; i++) {
            // 色の差を取得
            const rgb1 = pxs.data.slice(i*4, i*4+3);
            const rgb2 = pxs.data.slice((i+1)*4, (i+1)*4+3);
            const rgb3 = pxs.data.slice((i+img.width)*4, (i+img.width)*4+3);
            
            const diffX = getRgbDifference(rgb1, rgb2) * contrast;
            const diffY = getRgbDifference(rgb1, rgb3) * contrast;

            // imageDataを書き換え
            for (j = 0; j < 3; j++) {
                pxs.data[i*4+j] = Math.sqrt(diffX*diffY) < threshold ? 0 : 255;
                /*pxs.data[i*4+j] += diffX;
                pxs.data[i*4+j] -= diffY;*/
            }
        }

        ctx.putImageData(pxs, 0, 0);
    }


    
    /**
     * RGB値の差を取得
     */
    function getRgbDifference(rgb1, rgb2) {
        // RGB値をそれぞれ取得
        const r1 = rgb1[0];
        const g1 = rgb1[1];
        const b1 = rgb1[2];
        const r2 = rgb2[0];
        const g2 = rgb2[1];
        const b2 = rgb2[2];

        // RGB値の差を計算
        const diff = Math.sqrt((Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2))/3);

        return diff;
    }



    /**
     * キャンバスのサイズを自動調節
     */
    function fitCnavasToWindow() {
        // キャンバスサイズの最大値を設定
        const maxWidth = $("#preview-container").width() - 128;
        const maxHieght = $("#preview-container").height() - 128;

        cvs.css({
            "max-width": maxWidth,
            "max-height": maxHieght
        });

        // 拡大率を取得
        scale = cvs.width() / cvs.attr("width");
        $("#logger").html("Ratio: "+Math.round(scale*1000)/1000);

    }
});
  