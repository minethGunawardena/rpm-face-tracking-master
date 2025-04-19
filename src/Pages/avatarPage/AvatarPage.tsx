import './AvatarPage.css';
import { useEffect, useState, useRef, useCallback } from 'react';
import { FaceLandmarker, FaceLandmarkerOptions, FilesetResolver } from "@mediapipe/tasks-vision";
import { Matrix4, Euler } from 'three';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import DownloadConfirmationModal from '../../Components/PoupCards/DownloadConfirmationModal';
import SaveConfirmationModal from '../../Components/PoupCards/SaveConfirmationModal';
import supabase from '../../Components/Connections/supabaseClient';

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

function AvatarPage() {
  const [url, setUrl] = useState<string>(localStorage.getItem('lastAvatar') || "https://models.readyplayer.me/6460d95f9ae10f45bffb2864.glb?morphTargets=ARKit&textureAtlas=1024");
  const [recording, setRecording] = useState(false);
  const [customUrl, setCustomUrl] = useState<string>("");

  const [isDownloadModalVisible, setIsDownloadModalVisible] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [videoName, setVideoName] = useState("avatar-recording");
  const [videoDescription, setVideoDescription] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const toggleRecording = () => {
    setRecording(prev => !prev);
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
          (window as any).avatarBlob = blob;
          setIsDownloadModalVisible(true);
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

  const uploadVideoToSupabase = async (blob: Blob, name: string) => {
    const fileName = `${name}.webm`;
    const filePath = `videos/${fileName}`;
    const file = new File([blob], fileName, { type: 'video/webm' });

    const { error: uploadError } = await supabase.storage
      .from('vertual.parent.videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    return `https://sapauniiuubdrvkbvuty.supabase.co/storage/v1/object/public/vertual.parent.videos/${filePath}`;
  };

  const handleSaveConfirm = async () => {
    const blob = (window as any).avatarBlob;
    if (!blob) {
      alert('No video found to upload.');
      setIsSaveModalVisible(false);
      return;
    }

    const videoUrl = await uploadVideoToSupabase(blob, videoName);
    if (!videoUrl) {
      alert('Failed to upload video.');
      setIsSaveModalVisible(false);
      return;
    }

    const userId = uuidv4();

    const { error } = await supabase.from('videos').insert([{
      video_name: videoName,
      video_url: videoUrl,
      video_id: videoName,
      user_id: userId,
      description: videoDescription
    }]);

    if (error) {
      alert(`Failed to save video metadata: ${error.message}`);
    } else {
      alert(`Video "${videoName}" uploaded and saved successfully!`);
    }

    setIsSaveModalVisible(false);
  };

  const handleDownloadConfirm = (name: string, description: string) => {
    setVideoName(name);
    setVideoDescription(description);
    setIsDownloadModalVisible(false);
    setIsSaveModalVisible(true);
  };

  const handleCancel = () => {
    setIsDownloadModalVisible(false);
    setIsSaveModalVisible(false);
  };

  const predict = useCallback(async () => {
    let nowInMs = Date.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      const result = faceLandmarker.detectForVideo(video, nowInMs);

      if (result.faceBlendshapes?.[0]?.categories) {
        blendshapes = result.faceBlendshapes[0].categories;

        const matrix = new Matrix4().fromArray(result.facialTransformationMatrixes![0].data);
        rotation = new Euler().setFromRotationMatrix(matrix);
      }
    }

    window.requestAnimationFrame(predict);
  }, []);

  useEffect(() => {
    const setup = async () => {
      const resolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
      faceLandmarker = await FaceLandmarker.createFromOptions(resolver, options);

      video = document.getElementById("video") as HTMLVideoElement;
      navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predict);
      });
    };

    setup();
  }, [predict]);

  const presetAvatars = [
    "https://models.readyplayer.me/6460d95f9ae10f45bffb2864.glb?morphTargets=ARKit&textureAtlas=1024",
    "https://models.readyplayer.me/680275100f6d95f6d75bb221.glb?morphTargets=ARKit&textureAtlas=1024",
    "https://models.readyplayer.me/68028766679b181682f009e0.glb?morphTargets=ARKit&textureAtlas=1024"
  ];

  const handleAvatarChange = (newUrl: string) => {
    setUrl(newUrl);
    localStorage.setItem('lastAvatar', newUrl);
  };

  return (
    <div className="App">
      {recording && <div className="recording-indicator" />}
      <div className="avatar-selector">
        <h3>Choose Your Avatar</h3>
        <div className="preset-buttons">
          {presetAvatars.map((preset, index) => (
            <button key={index} onClick={() => handleAvatarChange(preset)}>
              Avatar {index + 1}
            </button>
          ))}
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
        <button onClick={() => {
          if (customUrl) {
            handleAvatarChange(customUrl);
            setCustomUrl("");
          }
        }}>Load Custom Avatar</button>
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

      {isDownloadModalVisible && (
        <DownloadConfirmationModal
          onDownload={handleDownloadConfirm}
          onCancel={handleCancel}
        />
      )}

      {isSaveModalVisible && (
        <SaveConfirmationModal
          onConfirm={handleSaveConfirm}
          onCancel={handleCancel}
        />
      )}

      <img className="logo" src="./logo.png" alt="logo" />
    </div>
  );
}

export default AvatarPage;
