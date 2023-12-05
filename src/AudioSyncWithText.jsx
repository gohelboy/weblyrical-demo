import { useEffect, useRef, useState } from 'react';
import "./styles.scss"

const AudioSyncWithText = () => {
  const [audioFile, setAudioFile] = useState(null); // to store audio file
  const [lrcFile, setLrcFile] = useState(null); // to store lrc file
  const [lyricsData, setLyricsData] = useState([]); // set lyrics in lines in array format
  const [currentLyric, setCurrentLyric] = useState(''); // set current line from lyricsData
  const [currentTime, setCurrentTime] = useState(0); // set current time from audioPlayer audio file
  const [audioPlayer, setAudioPlayer] = useState(null); // set audio fiel obejct
  const [isPlaying, setIsPlaying] = useState(false); // check music is playing ot not ?
  const lyricsContainerRef = useRef(null); // fro set current line in center 

  const handleAudioUpload = (event) => {
    const selectedAudioFile = event.target.files[0];
    setAudioFile(selectedAudioFile);

    const audio = new Audio(URL.createObjectURL(selectedAudioFile)); // create a new Audio object from audio file
    audio.addEventListener('timeupdate', updateCurrentLyricAndTime); // attach event listener every audio time updates calls funstion with event object
    setAudioPlayer(audio);
  };

  const updateCurrentLyricAndTime = (event) => {
    let currentTime = event.target.currentTime;
    setCurrentTime(currentTime);
    // selcts the current time line from array of lyrics data
    const currentLine = lyricsData.find(
      (line) => currentTime >= line.startTime && currentTime < line.endTime
    );

    if (currentLine) {
      setCurrentLyric(currentLine.text);
    } else {
      setCurrentLyric('');
    }
  };

  const handleLRCUpload = (event) => {
    const selectedLrcFile = event.target.files[0];
    setLrcFile(selectedLrcFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsedLyrics = parseLRCContent(content);
      setLyricsData(parsedLyrics);
    };
    reader.readAsText(selectedLrcFile);
  };

  const parseLRCContent = (content) => {
    const lines = content.split('\n'); // breaks into lines arrays
    const parsedLines = lines.map((line, index, array) => { // every line iterates through
      const match = line.match(/\[(\d{2}):(\d{2}).(\d{2})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3]);
        const startTime = minutes * 60 + seconds + milliseconds / 100;

        const nextLine = array[index + 1];
        let endTime;
        if (nextLine) {
          const nextMatch = nextLine.match(/\[(\d{2}):(\d{2}).(\d{2})\](.*)/);
          if (nextMatch) {
            const nextMinutes = parseInt(nextMatch[1]);
            const nextSeconds = parseInt(nextMatch[2]);
            const nextMilliseconds = parseInt(nextMatch[3]);
            endTime = nextMinutes * 60 + nextSeconds + nextMilliseconds / 100;
          }
        } else {
          // If it's the last line, set the endTime to a larger value or the end of the audio duration
          endTime = 1;
        }

        return {
          startTime,
          endTime,
          text: match[4].trim(),
        };
      }
      return null;
    });

    // Filter out lines that failed to parse
    const filteredLines = parsedLines.filter((line) => line !== null);
    return filteredLines;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    } else {
      audioPlayer.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (event) => {
    const seekTime = parseFloat(event.target.value);
    if (audioPlayer) {
      audioPlayer.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const scrollToActiveLine = () => {
    if (lyricsContainerRef.current) {
      const activeLine = lyricsContainerRef.current.querySelector('.current-line');
      if (activeLine) {
        const containerHeight = lyricsContainerRef.current.clientHeight;
        const scrollOffset = activeLine.offsetTop - containerHeight + activeLine.clientHeight / 2;
        lyricsContainerRef.current.scrollTo({ top: scrollOffset, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    scrollToActiveLine();
  }, [lyricsData, currentTime]);

  const renderLyrics = () => {
    return lyricsData.map((line, index) => {
      const isActive = currentTime >= line.startTime && currentTime <= line.endTime;

      return (
        <h3 key={index} className={isActive ? 'current-line' : 'line'}>
          {line.text}
        </h3>
      );
    });
  };

  // JSX for the file upload form
  return (
    <div className='demo'>
      <div className='info'>
        <h1>AUDIO TEST</h1>
        <input type="file" accept="audio/*" onChange={handleAudioUpload} />
        <input type="file" accept=".lrc" onChange={handleLRCUpload} />
        <p>Current Time:</p><h2>{formatTime(currentTime)}</h2>
        <button onClick={togglePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
        <input type="range" min="0" max={audioPlayer ? audioPlayer.duration : 0} step="0.1" value={currentTime} onChange={handleSeek} />
      </div>
      <div className="lyrics-box" ref={lyricsContainerRef}>
        {renderLyrics()}
      </div>
    </div >
  );
};

export default AudioSyncWithText;
