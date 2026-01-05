import React, { useState, useRef } from 'react';
import axios from 'axios';

function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [formattedPost, setFormattedPost] = useState('');
  const [status, setStatus] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording...');
    } catch (error) {
      setStatus('Microphone access denied');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setStatus('Processing...');
    }
  };

  const processAudio = async (audioBlob) => {
    try {
      // Step 1: Transcribe
      setStatus('Transcribing...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const transcribeRes = await axios.post('http://localhost:5002/transcribe', formData);
      const transcriptText = transcribeRes.data.transcript;
      setTranscript(transcriptText);

      // Step 2: Format
      setStatus('Formatting...');
      const formatRes = await axios.post('http://localhost:5002/format', {
        transcript: transcriptText
      });
      const formatted = formatRes.data.formatted_post;
      setFormattedPost(formatted);
      
      setStatus('Ready to post!');
    } catch (error) {
      setStatus('Error: ' + error.message);
      console.error('Processing error:', error);
    }
  };

  const postToX = async () => {
    try {
      setStatus('Posting to X...');
      await axios.post('http://localhost:5002/post', {
        content: formattedPost
      });
      setStatus('Posted successfully! ✨');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setTranscript('');
        setFormattedPost('');
        setStatus('');
      }, 3000);
    } catch (error) {
      setStatus('Post failed: ' + error.message);
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '50px auto',
      padding: '30px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>Chord</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Voice → X in seconds</p>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          transition: 'all 0.3s',
          marginBottom: '20px'
        }}
      >
        {isRecording ? '⏸ Stop' : '🎤 Record'}
      </button>

      {status && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {status}
        </div>
      )}

      {transcript && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Transcript:</h3>
          <p style={{ 
            padding: '15px', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            color: '#666'
          }}>
            {transcript}
          </p>
        </div>
      )}

      {formattedPost && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Formatted Post:</h3>
          <textarea
            value={formattedPost}
            onChange={(e) => setFormattedPost(e.target.value)}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '15px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <button
            onClick={postToX}
            style={{
              marginTop: '10px',
              padding: '12px 24px',
              backgroundColor: '#000',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Post to X →
          </button>
        </div>
      )}
    </div>
  );
}

export default VoiceRecorder;
