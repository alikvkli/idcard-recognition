import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ObjectDetection = () => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRunning, setIsRunning] = useState(true);
    const [videoWidth, setVideoWidth] = useState(640);
    const [videoHeight, setVideoHeight] = useState(480);

    useEffect(() => {
        const runObjectDetection = async () => {
            const net = await cocoSsd.load();
            detectObjects(net);
        };

        const waitForVideoLoad = () => {
            if (
                webcamRef.current &&
                webcamRef.current.video &&
                webcamRef.current.video.videoWidth &&
                webcamRef.current.video.videoHeight
            ) {
                setVideoWidth(webcamRef.current.video.videoWidth);
                setVideoHeight(webcamRef.current.video.videoHeight);
                runObjectDetection();
            } else {
                setTimeout(waitForVideoLoad, 100);
            }
        };

        waitForVideoLoad();

        return () => {
            setIsRunning(false);
        };
    }, []);

    const detectObjects = async (net) => {
        if (!isRunning) return;

        const video = webcamRef.current.video;
        const { videoWidth, videoHeight } = video;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        const predictions = await net.detect(video);
        drawPredictions(predictions);
        requestAnimationFrame(() => detectObjects(net));
    };

    const drawPredictions = (predictions) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        let color = "white";
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.lineWidth = 2;
        predictions
            .filter((prediction) => prediction.class !== 'person')
            .forEach(async (prediction) => {
                const x = prediction.bbox[0];
                const y = prediction.bbox[1];
                const width = prediction.bbox[2];
                const height = prediction.bbox[3];
                
                context.beginPath();
                context.rect(x, y, width, height);
                context.strokeStyle = color;
                context.stroke();

                const sharpness = calculateSharpness(x, y, width, height, canvas);
                
                if(sharpness > 7500){
                    color = "green";
                    context.beginPath();
                    context.rect(x, y, width, height);
                    context.strokeStyle = color;
                    context.stroke();
                }else{
                    color = "white";
                    context.beginPath();
                    context.rect(x, y, width, height);
                    context.strokeStyle = color;
                    context.stroke();
                }

                

                const cornerSize = 20; // Köşe çubuğu boyutu
                const gapSize = 10;

                // Sol üst köşe
                context.beginPath();
                context.moveTo(x - cornerSize + gapSize, y + gapSize);
                context.lineTo(x - cornerSize + gapSize, y - cornerSize + gapSize);
                context.lineTo(x + gapSize, y - cornerSize + gapSize);
                context.strokeStyle = color;
                context.stroke();

                // Sağ üst köşe
                context.beginPath();
                context.moveTo(x + width + gapSize, y + gapSize);
                context.lineTo(x + width + gapSize, y - cornerSize + gapSize);
                context.lineTo(x + width - cornerSize + gapSize, y - cornerSize + gapSize);
                context.strokeStyle = color;
                context.stroke();

                // Sağ alt köşe
                context.beginPath();
                context.moveTo(x + width + gapSize, y + height - gapSize);
                context.lineTo(x + width + gapSize, y + height + cornerSize - gapSize);
                context.lineTo(x + width - cornerSize + gapSize, y + height + cornerSize - gapSize);
                context.strokeStyle = color;
                context.stroke();

                // Sol alt köşe
                context.beginPath();
                context.moveTo(x + gapSize, y + height + gapSize);
                context.lineTo(x - cornerSize + gapSize, y + height + gapSize);
                context.lineTo(x - cornerSize + gapSize, y + height - cornerSize + gapSize);
                context.strokeStyle = color;
                context.stroke();

                
                console.log('Sharpness:', sharpness);
            });
    };

    const calculateSharpness = (x, y, width, height, canvas) => {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(x, y, width, height);
        const pixels = imageData.data;


        let sharpness = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const grayscale = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            const neighborIndices = getNeighborIndices(i / 4, width, height);
            const neighborGrayscale = neighborIndices.map((index) => {
                if (index >= 0 && index < pixels.length && pixels[index] != null) {
                  return pixels[index];
                } else {
                  return 0; // Varsayılan değeri burada 0 olarak seçtik
                }
              });
            const gradient = Math.max(...neighborGrayscale) - grayscale;
            sharpness += Math.abs(gradient);
        }

        return sharpness;
    };


    const getNeighborIndices = (index, width, height) => {
        const indices = [];
        const offsets = [-1, 0, 1];
        
        const x = index % width;
        const y = Math.floor(index / width);
      
        for (let i = 0; i < offsets.length; i++) {
          for (let j = 0; j < offsets.length; j++) {
            const neighborX = x + offsets[i];
            const neighborY = y + offsets[j];
      
            if (neighborX >= 0 && neighborX < width && neighborY >= 0 && neighborY < height) {
              const neighborIndex = (neighborY * width + neighborX) * 4;
              indices.push(neighborIndex);
            }
          }
        }
      
        return indices;
      };
      
    
    




    return (
        <div>
            <Webcam
                ref={webcamRef}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 9,
                    width: videoWidth,
                    height: videoHeight,
                }}
                videoConstraints={{
                    facingMode: 'environment',
                }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 10,
                }}
            />
        </div>
    );
};

export default ObjectDetection;
