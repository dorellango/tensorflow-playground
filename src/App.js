import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
// import tfn from "@tensorflow/tfjs-node";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const carnetTest = useRef(null);
  const [image, setImage] = useState("");

  // Main function
  const runModelTrained = async () => {
    // const modelPath =
    //   "/Users/diegoorellana/Downloads/object_detection/training/tfjsexport/model.json";
    const modelPath = "https://dorellango-dev-tf.s3.amazonaws.com/model.json";
    // const handler = tfn.io.fileSystem(modelPath);
    const net = await tf.loadGraphModel(modelPath);
    // const net2 = await tf.models.modelFromJSON(modelPath);

    // const carnet = document.getElementById("miCarnet");

    // console.log(carnetTest.current);

    // const browser = tf.browser.fromPixels(carnet);

    // const rsp = net.execute();

    // console.log(browser);
    setInterval(() => {
      if (image !== "") return;
      detect(net);
    }, 100);
  };

  const labelMap = { 1: { color: "green", name: "carnet", id: 1 } };

  const drawRect = (
    boxes,
    classes,
    scores,
    threshold,
    imgWidth,
    imgHeight,
    ctx
  ) => {
    for (let i = 0; i <= boxes.length; i++) {
      if (boxes[i] && classes[i] && scores[i] > threshold) {
        console.log("tomame este");
        const imageSrc = webcamRef.current.getScreenshot();

        setImage(imageSrc);

        // Extract variables
        const [y, x, width, height] = boxes[i];
        // console.log("bboxLeft: " + left);
        // console.log("bboxTop: " + top);
        // console.log("bboxWidth: " + width);
        // console.log("bboxHeight: " + height);
        const text = classes[i];

        // Set styling
        ctx.strokeStyle = labelMap[text]["color"];
        ctx.lineWidth = 2;
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";

        // DRAW!!
        ctx.beginPath();
        ctx.fillText(
          labelMap[text]["name"] + " - " + Math.round(scores[i] * 100) / 100,
          x * imgWidth,
          y * imgHeight - 10
        );
        ctx.rect(
          x * imgWidth,
          y * imgHeight,
          width * imgWidth,
          height * imgHeight
        );
        ctx.stroke();
      }
    }
  };

  const detect = async (net) => {
    if (image !== "") return;
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // 4. Make Detections
      const img = tf.browser.fromPixels(video);
      const resized = tf.image.resizeBilinear(img, [640, 480]);
      const casted = resized.cast("int32");
      const expanded = casted.expandDims(0);
      const obj = await net.executeAsync(expanded);

      const boxes = await obj[4].array(); // 0
      const scores = await obj[6].array(); // 2
      const classes = await obj[7].array();

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");

      // Update drawing utility
      requestAnimationFrame(() => {
        drawRect(
          boxes[0],
          classes[0],
          scores[0],
          0.98,
          videoWidth,
          videoHeight,
          ctx
        );
      });

      tf.dispose(img);
      tf.dispose(resized);
      tf.dispose(casted);
      tf.dispose(expanded);
      tf.dispose(obj);
    }
  };

  useEffect(() => {
    runModelTrained();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {/* <img
          id="miCarnet"
          ref={carnetTest}
          src="https://rutificadorchile.com/wp-content/uploads/2020/07/Carnet-de-identidad-con-n%C3%BAmero-de-documento.jpg"
        /> */}

        {image == "" ? (
          <div>
            <Webcam
              ref={webcamRef}
              muted={true}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                border: "3px solid yellow",
                zindex: 9,
                width: 640,
                height: 480,
              }}
            />

            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                border: "5px solid red",
                textAlign: "center",
                zindex: 8,
                width: 640,
                height: 480,
              }}
            />
          </div>
        ) : (
          <div>
            <img src={image} alt="holaaa" />
            <button onClick={() => setImage("")}></button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
