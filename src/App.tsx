import './App.css';
import { useEffect, useState, useRef } from 'react';
import { FaceLandmarker, FaceLandmarkerOptions, FilesetResolver } from "@mediapipe/tasks-vision";
import { Matrix4, Euler } from 'three';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

let video: HTMLVideoElement;
let faceLandmarker: FaceLandmarker;
let lastVideoTime = -1;
let blendshapes: any[] = [];
let rotation: Euler;
let headMesh: any[] = [];

const options: FaceLandmarkerOptions = {
  baseOptions: {
    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
    delegate: "GPU"
  },
  numFaces: 1,
  runningMode: "VIDEO",
  outputFaceBlendshapes: true,
  outputFacialTransformationMatrixes: true,
};

function Avatar({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { nodes } = useGraph(scene);

  useEffect(() => {
    headMesh = [];
    if (nodes.Wolf3D_Head) headMesh.push(nodes.Wolf3D_Head);
    if (nodes.Wolf3D_Teeth) headMesh.push(nodes.Wolf3D_Teeth);
    if (nodes.Wolf3D_Beard) headMesh.push(nodes.Wolf3D_Beard);
    if (nodes.Wolf3D_Avatar) headMesh.push(nodes.Wolf3D_Avatar);
    if (nodes.Wolf3D_Head_Custom) headMesh.push(nodes.Wolf3D_Head_Custom);
  }, [nodes]);

  useFrame(() => {
    if (blendshapes.length > 0) {
      blendshapes.forEach(element => {
        headMesh.forEach(mesh => {
          let index = mesh.morphTargetDictionary[element.categoryName];
          if (index >= 0) {
            mesh.morphTargetInfluences[index] = element.score;
          }
        });
      });

      nodes.Head.rotation.set(rotation.x, rotation.y, rotation.z);
      nodes.Neck.rotation.set(rotation.x / 5 + 0.3, rotation.y / 5, rotation.z / 5);
      nodes.Spine2.rotation.set(rotation.x / 10, rotation.y / 10, rotation.z / 10);
    }
  });

  return <primitive object={scene} position={[0, -1.7, 3.5]} />;
}

function App() {
  const [url, setUrl] = useState<string>(localStorage.getItem('lastAvatar') || "https://models.readyplayer.me/6460d95f9ae10f45bffb2864.glb?morphTargets=ARKit&textureAtlas=1024");
  const [recording, setRecording] = useState(false);
  const [customUrl, setCustomUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const toggleRecording = () => {
    setRecording((prev) => !prev);
    if (!recording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    if (canvasRef.current) {
      const stream = canvasRef.current.captureStream(30);
      navigator.mediaDevices.getUserMedia({ audio: true }).then((audioStream) => {
        const audioTrack = audioStream.getAudioTracks()[0];
        stream.addTrack(audioTrack);

        mediaRecorderRef.current = new MediaRecorder(stream);
        recordedChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const downloadUrl = URL.createObjectURL(blob);
          const shouldDownload = window.confirm("Recording finished! Click OK to download the video.");

          if (shouldDownload) {
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "avatar-recording.webm";
            a.click();
          }

          setTimeout(() => {
            window.location.reload();
          }, 500);
        };

        mediaRecorderRef.current.start();
        console.log("Recording started...");
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped.");
    }
  };

  const setup = async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, options);

    video = document.getElementById("video") as HTMLVideoElement;
    navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false,
    }).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predict);
    });
  };

  const predict = async () => {
    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      const faceLandmarkerResult = faceLandmarker.detectForVideo(video, nowInMs);

      if (faceLandmarkerResult.faceBlendshapes?.[0]?.categories) {
        blendshapes = faceLandmarkerResult.faceBlendshapes[0].categories;

        const matrix = new Matrix4().fromArray(faceLandmarkerResult.facialTransformationMatrixes![0].data);
        rotation = new Euler().setFromRotationMatrix(matrix);
      }
    }

    window.requestAnimationFrame(predict);
  };

  useEffect(() => {
    setup();
  }, [setup]);

  const presetAvatars = [
    "https://models.readyplayer.me/6460d95f9ae10f45bffb2864.glb?morphTargets=ARKit&textureAtlas=1024",
    "https://models.readyplayer.me/680275100f6d95f6d75bb221.glb?morphTargets=ARKit&textureAtlas=1024",
    "https://models.readyplayer.me/68028766679b181682f009e0.glb?morphTargets=ARKit&textureAtlas=1024"
  ];

  const handleAvatarChange = (newUrl: string) => {
    setUrl(newUrl);
    localStorage.setItem('lastAvatar', newUrl);  // Save the selected avatar URL
  };

  return (
    <div className="App">
      {/* Blinking Recording Indicator */}
      {recording && <div className="recording-indicator" />}

      <div className="avatar-selector">
        <h3>Choose Your Avatar</h3>
        <div className="preset-buttons">
          <button onClick={() => handleAvatarChange(presetAvatars[0])}>Avatar 1</button>
          <button onClick={() => handleAvatarChange(presetAvatars[1])}>Avatar 2</button>
          <button onClick={() => handleAvatarChange(presetAvatars[2])}>Avatar 3</button>
        </div>
      </div>

      <div className="custom-url-section">
        <input
          className="url-input"
          type="text"
          placeholder="Enter custom avatar URL"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
        />
        <button
          onClick={() => {
            if (customUrl) {
              handleAvatarChange(customUrl);
              setCustomUrl("");
            }
          }}
        >
          Load Custom Avatar
        </button>
      </div>

      <video className="camera-feed" id="video" autoPlay muted></video>

      <button className="record-btn" onClick={toggleRecording}>
        {recording ? "Stop" : "Record"}
      </button>

      <Canvas
        ref={canvasRef}
        className="avatar-canvas"
        camera={{ fov: 25 }}
        shadows
      >
        <color attach="background" args={["#d3d3f0"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, 0, 10]} intensity={0.5} />
        <Avatar url={url} />
      </Canvas>

      <img className="logo" src="./logo.png" alt="logo" />
    </div>
  );
}

export default App;
