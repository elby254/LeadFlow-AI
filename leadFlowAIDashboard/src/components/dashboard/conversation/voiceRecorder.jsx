/**
 * ==========================================================
 *
 * WhatsApp-style voice recorder for LeadFlow AI.
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Record voice notes
 * ✓ Pause / Resume recording
 * ✓ Stop recording
 * ✓ Cancel recording
 * ✓ Recording timer
 * ✓ Live recording indicator
 * ✓ Audio preview
 * ✓ Send voice note
 *
 * Used By
 * ----------------------------------------------------------
 * MessageComposer.jsx
 *
 * ==========================================================
 */

import { useState, useRef, useEffect } from "react";

import {
  Mic,
  Pause,
  Play,
  Square,
  Trash2,
  Send,
} from "lucide-react";

const VoiceRecorder = ({
  onSendVoiceNote,
}) => {
  /* ========================================================
     STATE
  ======================================================== */

  const [isRecording, setIsRecording] =
    useState(false);

  const [isPaused, setIsPaused] =
    useState(false);

  const [audioBlob, setAudioBlob] =
    useState(null);

  const [audioUrl, setAudioUrl] =
    useState("");

  const [seconds, setSeconds] =
    useState(0);

  /* ========================================================
     REFS
  ======================================================== */

  const recorderRef = useRef(null);

  const chunksRef = useRef([]);

  const streamRef = useRef(null);

  /* ========================================================
     TIMER
  ======================================================== */

  useEffect(() => {
    let interval;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [
    isRecording,
    isPaused,
  ]);

  /* ========================================================
     FORMAT TIME
  ======================================================== */

  const formatTime = () => {
    const mins = Math.floor(
      seconds / 60
    );

    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  /* ========================================================
     START RECORDING
  ======================================================== */

  const startRecording =
    async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        streamRef.current =
          stream;

        const recorder =
          new MediaRecorder(
            stream
          );

        recorderRef.current =
          recorder;

        chunksRef.current = [];

        recorder.ondataavailable =
          (event) => {
            if (
              event.data.size > 0
            ) {
              chunksRef.current.push(
                event.data
              );
            }
          };

        recorder.onstop =
          () => {
            const blob =
              new Blob(
                chunksRef.current,
                {
                  type: "audio/webm",
                }
              );

            setAudioBlob(blob);

            setAudioUrl(
              URL.createObjectURL(
                blob
              )
            );

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );
          };

        recorder.start();

        setSeconds(0);

        setIsRecording(true);

        setIsPaused(false);
      } catch (error) {
        console.error(
          "Microphone permission denied",
          error
        );
      }
    };

  /* ========================================================
     PAUSE
  ======================================================== */

  const pauseRecording =
    () => {
      if (
        recorderRef.current &&
        recorderRef.current.state ===
          "recording"
      ) {
        recorderRef.current.pause();

        setIsPaused(true);
      }
    };

  /* ========================================================
     RESUME
  ======================================================== */

  const resumeRecording =
    () => {
      if (
        recorderRef.current &&
        recorderRef.current.state ===
          "paused"
      ) {
        recorderRef.current.resume();

        setIsPaused(false);
      }
    };

  /* ========================================================
     STOP
  ======================================================== */

  const stopRecording =
    () => {
      if (
        recorderRef.current
      ) {
        recorderRef.current.stop();

        setIsRecording(false);

        setIsPaused(false);
      }
    };

  /* ========================================================
     CANCEL
  ======================================================== */

  const cancelRecording =
    () => {
      if (
        recorderRef.current &&
        recorderRef.current.state !==
          "inactive"
      ) {
        recorderRef.current.stop();
      }

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }

      setAudioBlob(null);

      setAudioUrl("");

      setSeconds(0);

      setIsRecording(false);

      setIsPaused(false);
    };

  /* ========================================================
     SEND
  ======================================================== */

  const sendRecording =
    () => {
      if (
        !audioBlob
      )
        return;

      onSendVoiceNote?.(
        audioBlob
      );

      cancelRecording();
    };

  /* ========================================================
     RECORDING UI
  ======================================================== */

  if (
    isRecording
  ) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-red-50 p-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-red-600" />

        <span className="font-medium">
          {formatTime()}
        </span>

        <button
          onClick={
            isPaused
              ? resumeRecording
              : pauseRecording
          }
          className="rounded-lg p-2 hover:bg-red-100"
        >
          {isPaused ? (
            <Play size={18} />
          ) : (
            <Pause size={18} />
          )}
        </button>

        <button
          onClick={
            stopRecording
          }
          className="rounded-lg p-2 hover:bg-red-100"
        >
          <Square size={18} />
        </button>

        <button
          onClick={
            cancelRecording
          }
          className="rounded-lg p-2 text-red-600 hover:bg-red-100"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  /* ========================================================
     PREVIEW
  ======================================================== */

  if (
    audioBlob
  ) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-white p-3">
        <audio
          controls
          src={audioUrl}
          className="flex-1"
        />

        <button
          onClick={
            sendRecording
          }
          className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700"
        >
          <Send size={18} />
        </button>

        <button
          onClick={
            cancelRecording
          }
          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  }

  /* ========================================================
     DEFAULT
  ======================================================== */

  return (
    <button
      onClick={
        startRecording
      }
      className="rounded-full bg-emerald-600 p-3 text-white transition hover:bg-emerald-700"
      title="Record Voice Note"
    >
      <Mic size={20} />
    </button>
  );
};

export default VoiceRecorder;