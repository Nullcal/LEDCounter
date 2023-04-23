$(function() {

    // 読み込み系
    const dropzone = $("#dropzone");

    // キャンバス要素系
    const cvs = $("#main-canvas");
    const ctx = cvs[0].getContext("2d");

    let enableAutoFit = true;

    let zoomRaito = 1;
    let img;

    
    // ピン
    // ピンの座標はcanvas上の座標（canvas左上を0,0として拡大率1のときの座標）で管理
    let pins = [];



    // ルーペ系
    const mgCvs = $("#magnify-canvas");
    const mgCtx = mgCvs[0].getContext("2d");

    const rem = parseFloat($("html").css("font-size"));
    let magnifierRadius = 8 * rem;

    let mgZoomRatio = 2;

    initMagnifier();


    // 軸変換
    const x = "left";
    const y = "top";

    

    /**
     * キャンバスとページの座標を変換
     * @param {number} val 変換する座標
     * @param {string} axis 座標の軸 x or y
     * @param {boolean} scale 拡大縮小の有無
     * @returns 変換した座標
     */
    function cvsToPage(val, axis, scale) {
        return val * (zoomRaito / (scale?1:zoomRaito)) + cvs.offset()[axis];
    }
    function pageToCvs(val, axis, scale) {
        return (val - cvs.offset()[axis]) / (zoomRaito / (scale?1:zoomRaito));
    }

    

    // ドラッグオーバー時に、背景色を変更する
    dropzone.on("dragover", function(e) {
        // デフォルトイベントは滅ぶべき
        e.preventDefault();
        
        $(this).addClass("dragover");
        return;
    });

    // ドラッグオーバーが終了したら、背景色を戻す
    dropzone.on("dragleave", function(e) {

        // デフォルトイベントは滅ぶべき
        e.preventDefault();
        
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
        const sx = pageToCvs(e.pageX,x,true) - (magnifierRadius/mgZoomRatio/2)/zoomRaito;
        const sy = pageToCvs(e.pageY,y,true) - (magnifierRadius/mgZoomRatio/2)/zoomRaito;

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



    /**
     * キャンバスをクリックでピンを追加
     */
    cvs.on("click", function(e) {

        // 4つまで
        if (pins.length > 3) return;


        pins.push({
            x: pageToCvs(e.pageX,x,true),
            y: pageToCvs(e.pageY,y,true)
        });

        // ピンをDOMに追加
        $("#pins-container").append(`<div id='pin-${pins.length-1}' class='pins'></div>`);

        // キャンバスを再描画
        refreshFrame();
    })



    // さいびょうがー
    function refreshFrame(e) {

        // マウスの位置にポインター表示
        ctx.fillStyle = "#00A7FF";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1/zoomRaito * .2;

        ctx.clearRect(0, 0, cvs.width(), cvs.height());

        ctx.drawImage(img, 0, 0, img.width, img.height);

        // ピンに沿ってパスを描画
        ctx.beginPath();
        
        for (i = 0; i < pins.length; i++) {
            ctx.lineTo(pins[i].x, pins[i].y);
            $(`#pin-${i}`).css({
                "left": cvsToPage(pins[i].x,x,true),
                "top": cvsToPage(pins[i].y,y,true) - $("header").height()
            })
        }

        ctx.closePath();
        ctx.stroke();
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
  