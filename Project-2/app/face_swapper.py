import cv2
import os
import warnings
from insightface.app import FaceAnalysis
from insightface.model_zoo import get_model

warnings.filterwarnings("ignore")


def process_video():

    # ======================================================
    # 🔴 SET INPUT FILES HERE (DO NOT CHANGE FOLDER NAMES)
    # ======================================================

    video_path = r"C:\Users\ghaza\Downloads\intership-project\FaceSwapper\models\BBC.mp4"   # ← Put your video here
    image_path = r"C:\Users\ghaza\Downloads\intership-project\FaceSwapper\models\w_face.png"    # ← Put your face image here
    model_path = r"C:\Users\ghaza\Downloads\intership-project\FaceSwapper\models\inswapper_128.onnx"  # ← Your downloaded model

    # ======================================================

    # Check files exist
    if not os.path.exists(video_path):
        print("❌ Video not found inside input folder")
        return

    if not os.path.exists(image_path):
        print("❌ Face image not found inside input folder")
        return

    if not os.path.exists(model_path):
        print("❌ inswapper_128.onnx not found inside models folder")
        return

    # Create output directory
    output_dir = "output"
    os.makedirs(output_dir, exist_ok=True)

    print("Loading face detection model (CPU)...")

    app_face = FaceAnalysis(
        name="buffalo_l",
        providers=["CPUExecutionProvider"]
    )
    app_face.prepare(ctx_id=-1, det_size=(320, 320))

    print("Loading face swap model...")
    swapper = get_model(model_path, providers=["CPUExecutionProvider"])

    # ---------- Extract Audio ----------
    print("Extracting audio from video...")
    audio_path = os.path.join(output_dir, "temp_audio.aac")

    os.system(f'ffmpeg -i "{video_path}" -vn -acodec copy "{audio_path}" -y')

    # ---------- Read Source Face ----------
    print("Detecting face in source image...")

    source_img = cv2.imread(image_path)

    if source_img is None:
        print("❌ Could not read face image")
        return

    source_faces = app_face.get(source_img)

    if len(source_faces) == 0:
        print("❌ No face detected in source image")
        return

    source_face = source_faces[0]
    print("✅ Face detected successfully")

    # ---------- Process Video ----------
    print("Starting video processing...")

    cap = cv2.VideoCapture(video_path)

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    output_video_path = os.path.join(output_dir, "output_video.mp4")

    out = cv2.VideoWriter(
        output_video_path,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1

        if frame_count % 30 == 0:
            print(f"Processing frame {frame_count}/{total_frames}")

        faces = app_face.get(frame)

        for face in faces:
            frame = swapper.get(frame, face, source_face, paste_back=True)

        out.write(frame)

    cap.release()
    out.release()

    print("Video processing completed!")

    # ---------- Merge Audio ----------
    print("Merging audio back...")

    final_output = os.path.join(output_dir, "final_output.mp4")

    if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
        os.system(
            f'ffmpeg -i "{output_video_path}" -i "{audio_path}" '
            f'-c:v copy -c:a aac "{final_output}" -y'
        )
    else:
        print("⚠ No audio found. Saving video without audio.")
        os.rename(output_video_path, final_output)

    print("\n==============================")
    print("✅ FACE SWAP COMPLETED!")
    print(f"Output saved here: {final_output}")
    print("==============================")


if __name__ == "__main__":
    print("=== Face Swapper (CPU Version) ===")
    print("Make sure you placed:")
    print("  input/video.mp4")
    print("  input/face.jpg")
    print("  models/inswapper_128.onnx\n")

    process_video()