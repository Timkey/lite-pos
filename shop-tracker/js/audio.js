// Audio Recording Manager
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.sessionId = null;
    this.startTime = null;
    this.chunkIndex = 0;
    this.maxChunkDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.chunkTimer = null;
  }

  async initialize() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Create MediaRecorder with optimal settings
      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 64000 // 64 kbps for good quality and smaller size
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.saveCurrentChunk();
      };

      console.log('[Audio] Recorder initialized');
      return true;
    } catch (error) {
      console.error('[Audio] Failed to initialize:', error);
      return false;
    }
  }

  async startRecording(sessionId) {
    if (!this.mediaRecorder) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize audio recorder');
      }
    }

    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.chunkIndex = 0;
    this.audioChunks = [];
    
    this.mediaRecorder.start();
    this.isRecording = true;

    // Set up automatic chunking
    this.scheduleChunkSave();

    console.log('[Audio] Recording started for session:', sessionId);
    this.updateUI();
  }

  scheduleChunkSave() {
    // Clear existing timer
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
    }

    // Schedule next chunk save
    this.chunkTimer = setTimeout(async () => {
      if (this.isRecording) {
        await this.createNewChunk();
        this.scheduleChunkSave();
      }
    }, this.maxChunkDuration);
  }

  async createNewChunk() {
    if (!this.isRecording) return;

    console.log('[Audio] Creating new chunk...');
    
    // Stop current recording temporarily
    this.mediaRecorder.stop();
    
    // Wait a moment for the stop event to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Start new recording
    this.audioChunks = [];
    this.mediaRecorder.start();
    this.chunkIndex++;
  }

  async saveCurrentChunk() {
    if (this.audioChunks.length === 0) return;

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const chunkId = `audio_${this.sessionId}_chunk${this.chunkIndex}_${Date.now()}`;

    try {
      // Save to IndexedDB
      await shopDB.add('audioChunks', {
        chunkId,
        sessionId: this.sessionId,
        chunkIndex: this.chunkIndex,
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        blob: audioBlob,
        size: audioBlob.size
      });

      console.log(`[Audio] Chunk ${this.chunkIndex} saved:`, chunkId, `(${(audioBlob.size / 1024).toFixed(2)} KB)`);

      // Update session with audio chunk reference
      const session = await shopDB.get('sessions', this.sessionId);
      if (session) {
        session.audioChunks = session.audioChunks || [];
        session.audioChunks.push(chunkId);
        await shopDB.put('sessions', session);
      }

      this.audioChunks = [];
    } catch (error) {
      console.error('[Audio] Failed to save chunk:', error);
    }
  }

  async stopRecording() {
    if (!this.isRecording) return;

    // Clear chunk timer
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;

    console.log('[Audio] Recording stopped');
    this.updateUI();
  }

  async pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
      console.log('[Audio] Recording paused');
      this.updateUI();
    }
  }

  async resumeRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.resume();
      console.log('[Audio] Recording resumed');
      this.updateUI();
    }
  }

  getRecordingDuration() {
    if (!this.startTime) return 0;
    return Date.now() - this.startTime;
  }

  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  updateUI() {
    const indicator = document.getElementById('recording-indicator');
    const timeDisplay = document.getElementById('recording-time');
    const statusBadge = document.getElementById('session-status');

    if (this.isRecording) {
      indicator.classList.remove('hidden');
      statusBadge.textContent = 'Recording';
      statusBadge.classList.add('recording');

      // Update time display every second
      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
      }
      
      this.timeUpdateInterval = setInterval(() => {
        const duration = this.getRecordingDuration();
        timeDisplay.textContent = this.formatDuration(duration);
      }, 1000);
    } else {
      indicator.classList.add('hidden');
      statusBadge.textContent = 'No Session';
      statusBadge.classList.remove('recording');

      if (this.timeUpdateInterval) {
        clearInterval(this.timeUpdateInterval);
        this.timeUpdateInterval = null;
      }
    }
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  // Playback functionality for review
  async getSessionAudio(sessionId) {
    const chunks = await shopDB.getAllByIndex('audioChunks', 'sessionId', sessionId);
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    return chunks;
  }

  async playChunk(chunkId) {
    const chunk = await shopDB.get('audioChunks', chunkId);
    if (chunk && chunk.blob) {
      const url = URL.createObjectURL(chunk.blob);
      const audio = new Audio(url);
      audio.play();
      return audio;
    }
    return null;
  }
}

// Create global audio recorder instance
const audioRecorder = new AudioRecorder();
