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
        setTimeout(() => {
            requestAnimationFrame(() => detectObjects(net));
        },150)
    };

    const drawPredictions = (predictions) => {
        const color = "green";
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
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
            });
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
