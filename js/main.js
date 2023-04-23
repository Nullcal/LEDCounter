$(function() {

    // 読み込み系
    const dropzone = $("#dropzone");

    // キャンバス要素系
    const cvs = $("#main-canvas");
    const ctx = cvs[0].getContext("2d");

    let enableAutoFit = true;

    let zoomRaito = 1;
    let img;

    // ピン打つ系
    let mouseX = -1;
    let mouseY = -1;

    let pins = [];

    // ルーペ系
    const mgCvs = $("#magnify-canvas");
    const mgCtx = mgCvs[0].getContext("2d");

    const rem = parseFloat($("html").css("font-size"));
    let magnifierRadius = 8 * rem;

    let mgZoomRatio = 2;

    initMagnifier();

    

    // ドラッグオーバー時に、背景色を変更する
    dropzone.on("dragover", function(e) {

        // デフォルトイベントは滅ぶべき
        e.preventDefault();  
        e.stopPropagation();
        
        $(this).addClass("dragover");
        return;
    });

    // ドラッグオーバーが終了したら、背景色を戻す
    dropzone.on("dragleave", function(e) {

        // デフォルトイベントは滅ぶべき
        e.preventDefault();  
        e.stopPropagation();
        
        $(this).removeClass("dragover");
        return;
    });



    // ドロップされた画像を読み込む
    dropzone.on("drop", function(e){

        // デフォルトイベントは滅ぶべき
        e.stopPropagation();
        e.preventDefault();

        // ドロップされたファイルを取得
        readImageFile(e.originalEvent.dataTransfer.files[0]);

        // 背景色を戻す
        dropzone.removeClass("dragover");
    });

    // 選択された画像を読み込む
    $("#image-loader").on("change", function(e) {

        // 選択されたファイルを取得
        readImageFile(e.target.files[0]);
    });



    // イベントから渡された画像を表示
    function readImageFile(file) {

        // キャンバスを表示
        $("#image-loader-container").addClass("hidden");
        $("#editor-container").removeClass("hidden");

        // FileReaderを使用して、画像を読み込む
        const reader = new FileReader();

        reader.onload = function(event) {

            // 画像を読み込み
            img = new Image();
            img.src = event.target.result;

            img.onload = function() {

                // キャンバスに画像を描画
                prepareEditor(img);
                fitCnavasToWindow();
            }
        }

        reader.readAsDataURL(file);
    }


    // キャンバスに画像を描画
    function prepareEditor(img) {
    
        // キャンバスをリサイズ
        cvs.attr("width", img.width);
        cvs.attr("height", img.height);

        // 初回のアニメーションを開始する
        //requestAnimationFrame(refreshFrame);
        refreshFrame()
    }



    // ルーペを初期化
    function initMagnifier() {
        $("#magnifier").css({
            "width": magnifierRadius+"px",
            "height": magnifierRadius+"px"
        })
        $("#magnify-canvas").attr({
            "width": magnifierRadius,
            "height": magnifierRadius
        })
    }

    // ルーペ再描画
    $(window).on("mousemove", function(e) {

        if ($("#editor-container").hasClass("hidden")) return;

        // ルーペ移動
        $("#magnifier").css({
            "left": e.pageX - $("#editor-container").offset().left,
            "top": e.pageY - $("#editor-container").offset().top
        })

        // ルーペの中身描画
        const sx = (e.pageX - $("#main-canvas").offset().left - magnifierRadius/mgZoomRatio/2)/zoomRaito;
        const sy = (e.pageY - $("#main-canvas").offset().top - magnifierRadius/mgZoomRatio/2)/zoomRaito;

        mgCtx.clearRect(0, 0, magnifierRadius, magnifierRadius);

        mgCtx.drawImage(cvs[0], sx, sy, magnifierRadius/mgZoomRatio/zoomRaito, magnifierRadius/mgZoomRatio/zoomRaito, 0, 0, magnifierRadius, magnifierRadius);
    })



    // ルーペの拡大率を変更
    $("#mgRatio").on("change", function() {
        mgZoomRatio = $(this).val();
    });

    // ルーペのサイズを変更
    $("#mgRadius").on("change", function() {
        magnifierRadius = $(this).val() * rem;
        initMagnifier();
    });



    // マウス位置を取得
    cvs.on("mousemove", function(e) {
        mouseX = e.offsetX / zoomRaito;
        mouseY = e.offsetY / zoomRaito;
    })



    // クリックされたら
    cvs.on("click", function() {
        // 4つまで
        if (pins.length < 4) {
            pins.push({
                x: mouseX,
                y: mouseY
            });
        }
        refreshFrame();
    })



    // さいびょうがー
    function refreshFrame(e) {

        // マウスの位置にポインター表示
        ctx.fillStyle = "#00A7FF";
        ctx.strokeStyle = "#00A7FF";

        ctx.clearRect(0, 0, cvs.width(), cvs.height());

        ctx.drawImage(img, 0, 0, img.width, img.height);

        // ピンに沿ってパスを描画
        ctx.beginPath();
        
        for (i = 0; i < pins.length; i++) {
            if (i == 0) {
                ctx.moveTo(pins[i].x, pins[i].y);
            } else {
                ctx.lineTo(pins[i].x, pins[i].y);
            }
        }

        ctx.closePath();
        ctx.stroke();

        // 再描画を要求する
        //requestAnimationFrame(refreshFrame);
    }



    // キャンバスのCSSサイズを自動調節
    function fitCnavasToWindow() {

        if (!enableAutoFit) return;

        const maxWidth = $("#preview-container").width();
        const maxHieght = $("#preview-container").height();

        cvs.css({
            "max-width": maxWidth,
            "max-height": maxHieght
        });

        zoomRaito = cvs.width() / cvs.attr("width");

        $("#logger").html("Ratio: "+Math.round(zoomRaito*1000)/1000);

    }



    // スクロール取得
    $("#scroll-handler").scroll(function(e) {

        console.log("SCROLLING!");
        e.stopPropagation();

    });



    // キャンバスのリサイズ
    $(window).resize(function(e) {

        fitCnavasToWindow();

        refreshFrame();
        
    })

});
  