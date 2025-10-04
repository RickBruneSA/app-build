
import { GoogleGenAI } from "@google/genai";
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- SYSTEM PROMPT & API ---
const SYSTEM_INSTRUCTION = `
Role & Voice: You are the Soul Refinery Companion App: a soulful, cinematic, and healing digital sanctuary that helps users with emotional release, self-reflection, and daily mindful practices.
The app’s voice and UI should always be: Warm, non-judgmental, and supportive; Minimalist, cinematic, and simple; Compassionate, safe, and validating; Written at a 7th-grade reading level for clarity.
Core Principles: Every interaction should feel like a gentle conversation. Always embody Carl Rogers’ principles: unconditional positive regard, empathy, and authenticity. Never overwhelm the user with too many choices — offer at most 2–3 clear next steps. Avoid jargon, long paragraphs, or medical claims.
Safety & Boundaries: The app is not medical advice. If user mentions self-harm: acknowledge feelings, encourage reaching out to trusted people or emergency services, and share a crisis resource.
Modules Overview:
- Mood Thermometer: Quick check-in. User picks a mood, you respond with a short empathetic message and suggest ONE helpful tool (a journal prompt, a short practice from the library, or an audio track).
- Practices Library (available practices for suggestions):
  - Grounding: 5 Senses Scan
  - Breathwork: Box Breath
  - Somatic Release: Somatic Shake
  - Self-Compassion: Hand-on-Heart
  - Sleep Reset: Body Scan
- Journaling Hub: For reflection.
- Audio Journey Hub: For guided audio experiences.
Your task is to respond to the user's selected mood.
`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DATA ---
const PRACTICES_DATA = {
    "Grounding": [{
        name: "5 Senses Scan",
        duration: "2 min",
        description: "A quick way to anchor yourself in the present moment when you feel disconnected or overwhelmed.",
        steps: [
            "Acknowledge 5 things you can see around you.",
            "Acknowledge 4 things you can feel ('my feet on the floor').",
            "Acknowledge 3 things you can hear.",
            "Acknowledge 2 things you can smell.",
            "Acknowledge 1 thing you can taste.",
        ],
    }],
    "Breathwork": [{
        name: "Box Breath",
        duration: "2 min",
        description: "Calms the nervous system and helps reduce stress.",
        steps: [
            "Breathe in slowly for a count of 4.",
            "Hold your breath for a count of 4.",
            "Breathe out slowly for a count of 4.",
            "Hold at the bottom for a count of 4.",
            "Repeat for 1-2 minutes.",
        ],
    }],
    "Somatic Release": [{
        name: "Somatic Shake",
        duration: "90s",
        description: "Helps release stored tension and energy from the body.",
        steps: [
            "Stand with your feet shoulder-width apart, knees slightly bent.",
            "Begin to gently shake your hands, then your arms.",
            "Let the shaking move into your shoulders, chest, and legs.",
            "Allow your whole body to shake for 60-90 seconds.",
            "Slowly come to a stop and notice the sensations.",
        ],
    }],
    "Self-Compassion": [{
        name: "Hand-on-Heart",
        duration: "1 min",
        description: "A simple gesture to offer yourself warmth and kindness.",
        steps: [
            "Place one or both hands over your heart.",
            "Feel the warmth of your hands.",
            "Take a few slow, deep breaths.",
            "Silently offer yourself a kind phrase, like 'This is a moment of suffering. May I be kind to myself.'",
        ],
    }]
};

const AUDIO_DATA = [
    { id: 'd01-intro', title: 'T-Rex Roar (Test)', duration: 3, url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', backupUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'd02-main', title: 'SoundHelix Song 2 (Test)', duration: 283, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', backupUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];


// --- ICONS ---
const HomeIcon = () => (<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const PracticesIcon = () => (<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>);
const MoodIcon = () => (<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>);
const ProfileIcon = () => (<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const PlayIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M8 5v14l11-7z"></path></svg>);
const PauseIcon = () => (<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>);
const BookmarkIcon = () => (<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>);


// --- UTILS ---
const getJSON = (key, fallback = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Failed to parse JSON from ${key}`, e);
        return fallback;
    }
};

const setJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to save JSON to ${key}`, e);
    }
};

const fmtTime = (seconds) => {
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

// --- REMINDER UTILS ---
const REMINDER_SETTINGS_KEY = 'sr.reminders.v1';

const loadReminderSettings = () => {
    const defaults = {
        enabled: false,
        hour: 9,
        minute: 0,
        days: [], // Empty means every day
        lastFiredISO: null,
    };
    return getJSON(REMINDER_SETTINGS_KEY, defaults) || defaults;
};

const saveReminderSettings = (settings) => {
    setJSON(REMINDER_SETTINGS_KEY, settings);
};

const shouldFireNow = (settings, now) => {
    if (!settings.enabled) return false;
    const day = now.getDay();
    const inDays = (settings.days?.length ?? 0) === 0 || settings.days.includes(day);
    if (!inDays) return false;

    const hh = now.getHours();
    const mm = now.getMinutes();
    const isTargetMinute = hh === settings.hour && mm === settings.minute;

    const key = new Date(now);
    key.setSeconds(0, 0);
    const last = settings.lastFiredISO ? new Date(settings.lastFiredISO) : null;
    const alreadyFired = last && Math.abs(+key - +last) < 60_000;
    
    return isTargetMinute && !alreadyFired;
};

const markFired = (settings, when) => {
    const fireTime = new Date(when);
    fireTime.setSeconds(0, 0);
    const newSettings = { ...settings, lastFiredISO: fireTime.toISOString() };
    saveReminderSettings(newSettings);
    return newSettings;
};

const buildIcs = (settings) => {
    const map = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const byday = (settings.days?.length ?? 0) ? settings.days.map(d => map[d]).join(',') : '';
    const rrule = byday ? `RRULE:FREQ=WEEKLY;BYDAY=${byday}` : `RRULE:FREQ=DAILY`;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dt = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(settings.hour)}${pad(settings.minute)}00`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Soul Refinery//Mood Reminder//EN',
        'BEGIN:VEVENT',
        `UID:sr-${now.getTime()}@soul-refinery`,
        `DTSTAMP:${dt}`,
        `DTSTART;TZID=America/New_York:${dt}`, // Example TZID, ideally this would be dynamic
        rrule,
        'SUMMARY:Mood Check-in — Soul Refinery',
        'DESCRIPTION:Take 30 seconds to track your mood in the app.',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    return new Blob([icsContent], { type: 'text/calendar' });
};


// --- HOOKS ---
const useReminderTicker = (onFire) => {
    useEffect(() => {
        const tick = () => {
            let settings = loadReminderSettings();
            const now = new Date();
            if (shouldFireNow(settings, now)) {
                markFired(settings, now);
                onFire();
            }
        };
        const id = setInterval(tick, 60_000);
        tick(); // Check on load
        return () => clearInterval(id);
    }, [onFire]);
};

const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('sr.theme');
        if (savedTheme) return savedTheme;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('sr.theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return { theme, toggleTheme };
};


// --- COMPONENTS ---
const LoadingSpinner = () => (
    <div className="loading-spinner">
        <div className="spinner"></div>
    </div>
);

const HomeScreen = ({ setPage }) => (
    <div className="home-screen fade-in">
        <h1>Welcome back.</h1>
        <p className="subtitle">One tiny step is enough today.</p>
        <div className="home-grid">
            <div className="home-card" role="button" onClick={() => setPage('mood')} aria-label="Open Mood Thermometer">
              <div>
                <h3>Mood Thermometer</h3>
                <p>A quick, gentle check-in on how you're feeling right now.</p>
              </div>
              <span className="chev" aria-hidden="true">›</span>
            </div>

            <div className="home-card" role="button" onClick={() => setPage('audio')} aria-label="Open Audio Journey Hub">
              <div>
                <h3>Audio Journey Hub</h3>
                <p>Listen to guided practices for emotional release.</p>
              </div>
              <span className="chev" aria-hidden="true">›</span>
            </div>

            <div className="home-card" role="button" onClick={() => setPage('journal')} aria-label="Open Journaling Hub">
              <div>
                <h3>Journaling Hub</h3>
                <p>Reflect with guided prompts or free-writing.</p>
              </div>
              <span className="chev" aria-hidden="true">›</span>
            </div>
        </div>
        <div className="reminders-link-container">
            <a href="#" className="reminders-link" onClick={(e) => { e.preventDefault(); setPage('reminders'); }}>
                Daily Reminders
            </a>
        </div>
    </div>
);

const logMood = (entry) => {
    const log = getJSON('sr_mood_log', []);
    log.push(entry);
    setJSON('sr_mood_log', log);
};

const MoodThermometer = ({ setPage }) => {
    const [step, setStep] = useState('select'); // 'select' or 'suggest'
    const [selectedMood, setSelectedMood] = useState(null);
    const [intensity, setIntensity] = useState(5);
    const [suggestion, setSuggestion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const moods = [
        { label: 'Frozen', emoji: '😶' },
        { label: 'Low', emoji: '☁️' },
        { label: 'Flat', emoji: '➖' },
        { label: 'Anxious', emoji: '😟' },
        { label: 'Sad', emoji: '😔' },
        { label: 'Angry', emoji: '😠' },
        { label: 'Overwhelmed', emoji: '🤯' },
        { label: 'Hopeful', emoji: '✨' },
        { label: 'Grounded', emoji: '🌱' },
    ];
    
    const handleSubmit = async () => {
        if (!selectedMood) return;

        setIsLoading(true);
        logMood({ mood: selectedMood, intensity, timestamp: new Date().toISOString() });

        let primary = null;
        const journalSuggestion = { name: "Journaling", description: "A 3-minute free-write.", type: 'journal', action: () => setPage('journal')};
        const audioSuggestion = { name: "Audio Journey", description: "Listen to a guided release.", type: 'audio', action: () => setPage('audio')};
        
        const fiveSenses = { name: "5 Senses Scan", description: "Ground yourself in the now.", type: 'practice', action: () => setPage('practices') };
        const boxBreath = { name: "Box Breath", description: "Calm your nervous system.", type: 'practice', action: () => setPage('practices') };
        const handOnHeart = { name: "Hand-on-Heart", description: "Offer yourself some warmth.", type: 'practice', action: () => setPage('practices') };
        const somaticShake = { name: "Somatic Shake", description: "Release stored tension.", type: 'practice', action: () => setPage('practices') };

        if (intensity >= 7) {
            primary = somaticShake;
        }

        if (['Frozen', 'Flat', 'Low'].includes(selectedMood)) {
            primary = fiveSenses;
        } else if (['Anxious', 'Overwhelmed'].includes(selectedMood)) {
            primary = boxBreath;
        } else if (['Sad', 'Angry'].includes(selectedMood)) {
            primary = handOnHeart;
        }
        
        if (!primary) {
            primary = journalSuggestion;
        }

        let secondaryOptions = [journalSuggestion, audioSuggestion, fiveSenses, boxBreath, handOnHeart].filter(opt => opt.name !== primary.name);

        try {
            const prompt = `The user is feeling: '${selectedMood}' at an intensity of ${intensity}/10. Write a short (1-2 sentence), warm, non-judgmental, and supportive acknowledgement of their feeling. Keep the tone compassionate and simple, like a gentle conversation. Do not give advice or suggestions, just validation.`;
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction: SYSTEM_INSTRUCTION }
            });

            setSuggestion({
                acknowledgement: result.text,
                primary: primary,
                secondary: secondaryOptions.slice(0, 2)
            });
            
        } catch (error) {
            console.error("Error fetching Gemini response:", error);
            setSuggestion({
                acknowledgement: "It's okay to feel this way. Thank you for checking in with yourself.",
                primary: primary,
                secondary: secondaryOptions.slice(0, 2)
            });
        } finally {
            setIsLoading(false);
            setStep('suggest');
        }
    };

    const resetFlow = () => {
        setStep('select');
        setSelectedMood(null);
        setIntensity(5);
        setSuggestion(null);
    }

    return (
        <div className="mood-thermometer fade-in">
            {isLoading && <LoadingSpinner />}
            
            {step === 'select' && (
                <>
                    <h2>Where are you right now?</h2>
                    <div className="mood-grid-large">
                        {moods.map(mood => (
                            <div 
                                key={mood.label} 
                                className={`mood-option-large ${selectedMood === mood.label ? 'selected' : ''}`}
                                onClick={() => setSelectedMood(mood.label)}
                                role="button" 
                                tabIndex={0} 
                                aria-label={`Select mood: ${mood.label}`}
                                aria-pressed={selectedMood === mood.label}
                            >
                                <span className="emoji" aria-hidden="true">{mood.emoji}</span>
                                <span className="label">{mood.label}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="intensity-slider-container">
                        <label htmlFor="intensity">Intensity: {intensity}</label>
                        <input
                            type="range"
                            id="intensity"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            aria-label="Intensity slider"
                        />
                    </div>

                    <button className="button" onClick={handleSubmit} disabled={!selectedMood || isLoading}>
                        Continue
                    </button>
                </>
            )}

            {step === 'suggest' && suggestion && (
                <div className="suggestion-screen fade-in">
                    <p className="acknowledgement">{suggestion.acknowledgement}</p>
                    
                    <h3>Here's one thing that might help:</h3>
                    <div className="suggestion-card primary" role="button" onClick={suggestion.primary.action}>
                         <h4>{suggestion.primary.name}</h4>
                         <p>{suggestion.primary.description}</p>
                         <span className="chev" aria-hidden="true">›</span>
                    </div>

                    {suggestion.secondary.length > 0 && <h3>Or, a few other ideas:</h3>}
                    {suggestion.secondary.map(item => (
                         <div className="suggestion-card secondary" key={item.name} role="button" onClick={item.action}>
                             <div>
                                 <h4>{item.name}</h4>
                                 <p>{item.description}</p>
                             </div>
                             <span className="chev" aria-hidden="true">›</span>
                         </div>
                    ))}

                    <button className="button-secondary" onClick={resetFlow}>
                        Check in again
                    </button>
                </div>
            )}
        </div>
    );
};

const PracticeItem = ({ practice }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="practice-item">
            <div className="practice-header" onClick={() => setIsOpen(!isOpen)} role="button" tabIndex={0} aria-expanded={isOpen}>
                <h4>{practice.name}</h4>
                <span>{practice.duration}</span>
            </div>
            {isOpen && (
                <div className="practice-details fade-in">
                    <p>{practice.description}</p>
                    <ol>
                        {practice.steps.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                </div>
            )}
        </div>
    );
};

const PracticesLibrary = () => (
    <div className="practices-library fade-in">
        <h2>Practices Library</h2>
        <p>A collection of quick, bite-sized practices to support you.</p>
        {Object.entries(PRACTICES_DATA).map(([category, practices]) => (
            <div key={category} className="practice-category">
                <h3>{category}</h3>
                {practices.map(practice => <PracticeItem key={practice.name} practice={practice} />)}
            </div>
        ))}
    </div>
);

const AudioTrack = ({ track, setPage, resumeRequest, onTrackPlay }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const saveInterval = useRef(null);
    const isRetrying = useRef(false);

    useEffect(() => {
        const audio = audioRef.current;
        const handleError = () => {
            const usingBackup = audio.src === track.backupUrl;
            if (track.backupUrl && !usingBackup && !isRetrying.current) {
                isRetrying.current = true;
                audio.src = track.backupUrl;
                audio.load();
                audio.play().catch(() => {});
            }
        };
        audio.addEventListener('error', handleError);
        return () => audio.removeEventListener('error', handleError);
    }, [track.url, track.backupUrl]);


    // --- Data Loaders ---
    useEffect(() => {
        const allBookmarks = getJSON('sr.audio.bookmarks.v1', []);
        setBookmarks(allBookmarks.filter(b => b.trackId === track.id));

        const audio = audioRef.current;
        const onLoadedMetadata = () => {
            const completionData = getJSON('sr_audio_progress', {});
            const savedProgress = completionData[track.id] || 0;
            if (savedProgress >= 100) {
                setIsComplete(true);
            }
        };
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        return () => audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    }, [track.id]);

    // --- Resume Logic ---
    useEffect(() => {
        if (resumeRequest && resumeRequest.trackId === track.id) {
            const audio = audioRef.current;
            const seekAndPlay = () => {
                audio.currentTime = resumeRequest.currentTime;
                audio.play();
                setIsPlaying(true);
                onTrackPlay(track.id);
            };
            if (audio.readyState >= 1) { // HAVE_METADATA
                seekAndPlay();
            } else {
                audio.addEventListener('loadedmetadata', seekAndPlay, { once: true });
            }
        }
    }, [resumeRequest, track.id, onTrackPlay]);


    // --- Playback Listeners ---
    useEffect(() => {
        const audio = audioRef.current;

        const saveCurrentTime = () => {
            setJSON('sr.audio.v1', { trackId: track.id, currentTime: audio.currentTime });
        };
        
        const throttledSave = () => {
             if (!saveInterval.current) {
                saveInterval.current = setInterval(saveCurrentTime, 5000);
             }
        };

        const stopThrottledSave = () => {
            if (saveInterval.current) {
                clearInterval(saveInterval.current);
                saveInterval.current = null;
            }
        };

        const handleTimeUpdate = () => {
            if (audio.duration) {
                const newProgress = (audio.currentTime / audio.duration) * 100;
                setProgress(newProgress);
            }
        };
        
        const handlePlay = () => {
            isRetrying.current = false; // Reset retry flag on successful play
            throttledSave();
        }
        const handlePause = () => {
            stopThrottledSave();
            saveCurrentTime();
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setIsComplete(true);
            setProgress(100);
            const allProgress = getJSON('sr_audio_progress', {});
            allProgress[track.id] = 100;
            setJSON('sr_audio_progress', allProgress);
            stopThrottledSave();
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            stopThrottledSave();
        };
    }, [track.id]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Play failed:", e));
            onTrackPlay(track.id); // Notify parent which track is playing
        }
        setIsPlaying(!isPlaying);
    };
    
    const handleSeek = (e) => {
        const newProgress = parseFloat(e.target.value);
        if(audioRef.current && audioRef.current.duration) {
            const newTime = (newProgress / 100) * audioRef.current.duration;
            audioRef.current.currentTime = newTime;
            setProgress(newProgress);
        }
    }

    const markComplete = () => {
        setIsComplete(true);
        setProgress(100);
        const allProgress = getJSON('sr_audio_progress', {});
        allProgress[track.id] = 100;
        setJSON('sr_audio_progress', allProgress);
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };
    
    const addBookmark = () => {
        const currentTime = audioRef.current.currentTime;
        const newBookmark = {
            ts: Date.now(),
            trackId: track.id,
            title: track.title,
            time: currentTime
        };
        const allBookmarks = getJSON('sr.audio.bookmarks.v1', []);
        const updatedBookmarks = [newBookmark, ...allBookmarks];
        setJSON('sr.audio.bookmarks.v1', updatedBookmarks);
        setBookmarks(updatedBookmarks.filter(b => b.trackId === track.id));
    };
    
    const seekToBookmark = (time) => {
        audioRef.current.currentTime = time;
    };


    return (
        <div className="audio-track">
            <audio ref={audioRef} src={track.url} preload="metadata" crossOrigin="anonymous"></audio>
            <div className="audio-info">
                <h4>{track.title}</h4>
                <span>{fmtTime(track.duration)}</span>
            </div>
            <div className="audio-controls">
                <button className="play-pause-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                 <div className="progress-container">
                    <input
                        type="range"
                        className="progress-bar"
                        value={progress}
                        min="0"
                        max="100"
                        step="0.1"
                        onChange={handleSeek}
                        aria-label="Audio progress"
                    />
                    <div className="time-display">
                        <span>{fmtTime(audioRef.current?.currentTime || 0)}</span>
                        <span>{fmtTime(track.duration)}</span>
                    </div>
                </div>
            </div>
             <div className="audio-actions">
                 <button className="bookmark-btn" onClick={addBookmark} aria-label="Add bookmark">
                    <BookmarkIcon/> <span>Bookmark</span>
                </button>
                {!isComplete && (
                    <button className="button-secondary mark-complete" onClick={markComplete}>
                        Mark complete
                    </button>
                )}
            </div>
            {bookmarks.length > 0 && (
                <div className="bookmarks-list">
                    <h4>Bookmarks</h4>
                    {bookmarks.map(bm => (
                        <div key={bm.ts} className="bookmark-item" onClick={() => seekToBookmark(bm.time)}>
                            <span>{fmtTime(bm.time)}</span>
                        </div>
                    ))}
                </div>
            )}
            {isComplete && (
                <div className="suggestion-card completion-suggestion fade-in" role="button" onClick={() => setPage('practices')}>
                    <div>
                        <h4>Integrate your practice</h4>
                        <p>Try a 1-minute Hand-on-Heart to seal your reflection.</p>
                    </div>
                    <span className="chev" aria-hidden="true">›</span>
                </div>
            )}
        </div>
    );
};

const AudioJourneyHub = ({ setPage }) => {
    const [lastPlayed, setLastPlayed] = useState(null);
    const [resumeRequest, setResumeRequest] = useState(null);
    const [activeTrackId, setActiveTrackId] = useState(null);

    useEffect(() => {
        setLastPlayed(getJSON('sr.audio.v1', null));
    }, []);

    const handleResume = () => {
        setResumeRequest(lastPlayed);
        setActiveTrackId(lastPlayed.trackId);
        setLastPlayed(null); // Hide the resume pill after clicking
    };

    const handleTrackPlay = (trackId) => {
        setActiveTrackId(trackId);
        if (resumeRequest && resumeRequest.trackId !== trackId) {
            setResumeRequest(null);
        }
    };
    
    const handleAutoSkip = (failedTrackId) => {
         const currentIndex = AUDIO_DATA.findIndex(t => t.id === failedTrackId);
         const nextIndex = (currentIndex + 1) % AUDIO_DATA.length;
         const nextTrack = AUDIO_DATA[nextIndex];
         setResumeRequest({ trackId: nextTrack.id, currentTime: 0 });
         setActiveTrackId(nextTrack.id);
    };

    const lastPlayedTrack = lastPlayed ? AUDIO_DATA.find(t => t.id === lastPlayed.trackId) : null;

    return (
        <div className="audio-journey-hub fade-in">
            <h2>Audio Journey Hub</h2>
            <p>Guided practices for emotional release and reflection.</p>

            {lastPlayed && lastPlayedTrack && (
                <div className="resume-pill" onClick={handleResume}>
                    <span>Resume: {lastPlayedTrack.title} from {fmtTime(lastPlayed.currentTime)}</span>
                </div>
            )}

            <div className="audio-list">
                {AUDIO_DATA.map(track => (
                    <AudioTrack
                        key={track.id}
                        track={track}
                        setPage={setPage}
                        resumeRequest={activeTrackId === track.id ? resumeRequest : null}
                        onTrackPlay={handleTrackPlay}
                    />
                ))}
            </div>
        </div>
    );
};


const JournalingHub = () => {
    const [text, setText] = useState('');
    const [history, setHistory] = useState([]);
    const debounceTimeout = useRef(null);
    const textareaRef = useRef(null);

    // Load initial state from localStorage
    useEffect(() => {
        try {
            const savedText = localStorage.getItem('sr.journal.v1') || '';
            const savedHistory = JSON.parse(localStorage.getItem('sr.journal.history.v1')) || [];
            setText(savedText);
            setHistory(savedHistory);
        } catch (e) {
            console.error("Failed to load from localStorage", e);
        }
    }, []);

    const saveText = (currentText) => {
        try {
            localStorage.setItem('sr.journal.v1', currentText);
        } catch (e) {
            console.error("Failed to save journal text", e);
        }
    };

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setText(newText);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            saveText(newText);
        }, 1000); // 1s debounce
    };

    const handleBlur = () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        saveText(text);
    };

    const handleNewEntry = () => {
        if (text.trim() === '') {
            setText('');
            textareaRef.current?.focus();
            return;
        }

        const newHistoryEntry = { ts: Date.now(), text };
        const updatedHistory = [newHistoryEntry, ...history];
        
        setHistory(updatedHistory);
        setText('');
        
        try {
            localStorage.setItem('sr.journal.history.v1', JSON.stringify(updatedHistory));
            localStorage.removeItem('sr.journal.v1');
        } catch (e) {
            console.error("Failed to archive entry", e);
        }

        textareaRef.current?.focus();
    };

    const handleRestoreEntry = (entryToRestore) => {
        // First, archive the current text if it's not empty
        if (text.trim() !== '') {
             const newHistoryEntry = { ts: Date.now(), text };
             const updatedHistory = [newHistoryEntry, ...history.filter(h => h.ts !== entryToRestore.ts)];
             setHistory(updatedHistory);
             localStorage.setItem('sr.journal.history.v1', JSON.stringify(updatedHistory));
        } else {
             // remove the restored entry from history
             const updatedHistory = history.filter(h => h.ts !== entryToRestore.ts);
             setHistory(updatedHistory);
             localStorage.setItem('sr.journal.history.v1', JSON.stringify(updatedHistory));
        }
        
        setText(entryToRestore.text);
        saveText(entryToRestore.text);
    };

    const wordCount = useMemo(() => {
        return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    }, [text]);

    return (
        <div className="journaling-hub fade-in">
            <h2>Journaling Hub</h2>
            <div className="journal-editor-container">
                <textarea
                    ref={textareaRef}
                    className="journal-editor"
                    value={text}
                    onChange={handleTextChange}
                    onBlur={handleBlur}
                    placeholder="Write whatever you feel…"
                    aria-label="Journaling text area"
                ></textarea>
                <div className="journal-meta">
                    <span>{wordCount} words</span>
                </div>
            </div>
            <div className="journal-actions">
                <button className="button" onClick={handleNewEntry}>
                    {text.trim() === '' ? 'Start New Entry' : 'Done'}
                </button>
                <button className="button-secondary" disabled>Audio Chat (coming soon)</button>
            </div>
            
            {history.length > 0 && (
                <div className="past-entries">
                    <h3>Past Entries</h3>
                    <div className="past-entries-list">
                        {history.map(entry => (
                            <div key={entry.ts} className="past-entry-item" role="button" onClick={() => handleRestoreEntry(entry)}>
                                <span className="entry-date">{new Date(entry.ts).toLocaleDateString()}</span>
                                <p className="entry-preview">{entry.text.substring(0, 80)}...</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const ProfileScreen = ({ setPage, theme, toggleTheme }) => {
    const [stats, setStats] = useState({ moods: 0, entries: 0, practices: 0 });

    useEffect(() => {
        const moodLog = getJSON('sr_mood_log', []);
        const journalHistory = getJSON('sr.journal.history.v1', []);
        const audioProgress = getJSON('sr_audio_progress', {});
        const completedPractices = Object.values(audioProgress).filter(p => (p as number) >= 100).length;
        
        setStats({
            moods: moodLog.length,
            entries: journalHistory.length,
            practices: completedPractices
        });
    }, []);

    return (
        <div className="profile-screen fade-in">
            <h2>Profile & Settings</h2>
            <p>A summary of your journey and app settings.</p>

            <h3>Your Journey So Far</h3>
            <div className="stats-grid">
                <div className="stat-card">
                    <h4>{stats.moods}</h4>
                    <p>Moods Logged</p>
                </div>
                <div className="stat-card">
                    <h4>{stats.entries}</h4>
                    <p>Journal Entries</p>
                </div>
                <div className="stat-card">
                    <h4>{stats.practices}</h4>
                    <p>Practices Completed</p>
                </div>
            </div>

            <h3>Appearance</h3>
            <div className="setting-row toggle-row">
                <label htmlFor="dark-mode-toggle">Dark Mode</label>
                <input
                    type="checkbox"
                    id="dark-mode-toggle"
                    className="toggle-switch"
                    checked={theme === 'dark'}
                    onChange={toggleTheme}
                />
            </div>
            
            <h3>Data Management</h3>
             <div className="home-card" role="button" onClick={() => setPage('backup')} aria-label="Open Backup and Export Center">
              <div>
                <h4>Backup & Export</h4>
                <p>Save or import your app data.</p>
              </div>
              <span className="chev" aria-hidden="true">›</span>
            </div>
        </div>
    );
};

const BackupExportCenter = ({ setPage }) => {
    const fileInputRef = useRef(null);
    const [dataCounts, setDataCounts] = useState({ mood: 0, journalHistory: 0, bookmarks: 0 });
    
    const DATA_KEYS = {
        moodLog: 'sr_mood_log',
        journalCurrent: 'sr.journal.v1',
        journalHistory: 'sr.journal.history.v1',
        audioProgress: 'sr_audio_progress',
        lastPlayed: 'sr.audio.v1',
        bookmarks: 'sr.audio.bookmarks.v1',
    };

    useEffect(() => {
        const moodLog = getJSON(DATA_KEYS.moodLog, []);
        const journalHistory = getJSON(DATA_KEYS.journalHistory, []);
        const bookmarks = getJSON(DATA_KEYS.bookmarks, []);
        setDataCounts({
            mood: moodLog.length,
            journalHistory: journalHistory.length,
            bookmarks: bookmarks.length,
        });
    }, [DATA_KEYS.moodLog, DATA_KEYS.journalHistory, DATA_KEYS.bookmarks]);
    
    const getAllData = () => {
        const data = {};
        for(const key in DATA_KEYS) {
            const lsKey = DATA_KEYS[key];
            const value = localStorage.getItem(lsKey);
            if (value !== null) {
                 try {
                     data[lsKey] = JSON.parse(value);
                 } catch {
                     data[lsKey] = value;
                 }
            }
        }
        return data;
    }

    const triggerDownload = (filename, blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    const handleExportJson = () => {
        const allData = getAllData();
        const jsonString = JSON.stringify(allData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        triggerDownload('soul-refinery-backup.json', blob);
    }

    const handleExportCsv = (key, filename) => {
        const data = getJSON(DATA_KEYS[key], []);
        if (data.length === 0) return;

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(value => {
                const str = String(value);
                if (str.includes(',')) return `"${str.replace(/"/g, '""')}"`;
                return str;
            }).join(',')
        );
        
        const csvString = [headers, ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(filename, blob);
    };

    const handleImportJson = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result as string);
                
                const validKeys = Object.values(DATA_KEYS);
                const hasValidData = Object.keys(importedData).some(key => validKeys.includes(key));
                
                if (!hasValidData) {
                    alert('This does not appear to be a valid backup file.');
                    return;
                }
                
                if (window.confirm('This will overwrite your current data. Are you sure you want to proceed?')) {
                    Object.keys(importedData).forEach(key => {
                        if (validKeys.includes(key)) {
                            setJSON(key, importedData[key]);
                        }
                    });
                    alert('Data imported successfully.');
                    // Refresh counts
                    const moodLog = getJSON(DATA_KEYS.moodLog, []);
                    const journalHistory = getJSON(DATA_KEYS.journalHistory, []);
                    const bookmarks = getJSON(DATA_KEYS.bookmarks, []);
                     setDataCounts({
                        mood: moodLog.length,
                        journalHistory: journalHistory.length,
                        bookmarks: bookmarks.length,
                    });
                }
            } catch (err) {
                alert('Failed to read or parse the backup file.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="backup-center fade-in">
            <button className="back-button" onClick={() => setPage('profile')}>‹ Back to Profile</button>
            <h2>Backup & Export</h2>
            <p>Export your data for safekeeping or import a previous backup.</p>

            <div className="data-summary">
                <p>Current data: <strong>{dataCounts.mood}</strong> moods, <strong>{dataCounts.journalHistory}</strong> journals, <strong>{dataCounts.bookmarks}</strong> bookmarks.</p>
            </div>
            
            <div className="backup-actions">
                <button className="button" onClick={handleExportJson}>Export All (JSON)</button>
                <button className="button-secondary" onClick={() => handleExportCsv('moodLog', 'mood-log.csv')}>Export Moods (CSV)</button>
                <button className="button-secondary" onClick={() => handleExportCsv('journalHistory', 'journal-history.csv')}>Export Journals (CSV)</button>
                 <button className="button-secondary" onClick={() => handleExportCsv('bookmarks', 'audio-bookmarks.csv')}>Export Bookmarks (CSV)</button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportJson}
                    accept="application/json"
                    style={{ display: 'none' }}
                />
                 <button className="button" onClick={() => fileInputRef.current.click()}>Import from JSON</button>
            </div>
        </div>
    );
}

const RemindersScreen = ({ setPage }) => {
    const [settings, setSettings] = useState(loadReminderSettings);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    const handleSave = () => {
        saveReminderSettings(settings);
        alert("Reminder settings saved.");
    };

    const handleTimeChange = (e) => {
        const [hour, minute] = e.target.value.split(':').map(Number);
        setSettings(s => ({ ...s, hour, minute }));
    };

    const toggleDay = (dayIndex) => {
        const newDays = settings.days.includes(dayIndex)
            ? settings.days.filter(d => d !== dayIndex)
            : [...settings.days, dayIndex].sort();
        setSettings(s => ({ ...s, days: newDays }));
    };

    const handleRequestNotification = async () => {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };
    
    const handleDownloadIcs = () => {
        const blob = buildIcs(settings);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soul-refinery-reminder.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const timeValue = `${String(settings.hour).padStart(2, '0')}:${String(settings.minute).padStart(2, '0')}`;
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="reminders-screen fade-in">
            <button className="back-button" onClick={() => setPage('home')}>‹ Back to Home</button>
            <h2>Daily Mood Reminder</h2>
            <p>Set a gentle reminder for your daily check-in.</p>
            
            <div className="reminder-settings-card">
                 <div className="setting-row toggle-row">
                    <label htmlFor="reminder-enabled">Enable Daily Reminder</label>
                    <input 
                        type="checkbox" 
                        id="reminder-enabled"
                        className="toggle-switch"
                        checked={settings.enabled}
                        onChange={(e) => setSettings(s => ({...s, enabled: e.target.checked}))}
                    />
                </div>

                <div className="setting-row">
                    <label htmlFor="reminder-time">Remind me at</label>
                    <input 
                        type="time" 
                        id="reminder-time"
                        value={timeValue}
                        onChange={handleTimeChange}
                    />
                </div>

                <div className="setting-row">
                     <label>On these days</label>
                     <div className="day-pills">
                        {dayLabels.map((label, index) => (
                            <button 
                                key={index} 
                                className={`day-pill ${settings.days.includes(index) ? 'selected' : ''}`}
                                onClick={() => toggleDay(index)}
                            >
                                {label}
                            </button>
                        ))}
                     </div>
                     <p className="help-text">Leave all days unselected to be reminded every day.</p>
                </div>
            </div>
            
             <div className="reminder-actions">
                 <button className="button" onClick={handleSave}>Save Settings</button>
                 {notificationPermission !== 'granted' && (
                     <button className="button-secondary" onClick={handleRequestNotification}>
                         Enable Browser Notifications
                     </button>
                 )}
                 <button className="button-secondary" onClick={handleDownloadIcs}>
                     Add to Calendar (.ics)
                 </button>
             </div>
             <p className="help-text">Browser notifications only show when this app is open. For background reminders, add it to your calendar.</p>
        </div>
    );
};


const FooterNav = ({ activePage, setPage }) => {
    const navItems = [
        { id: 'home', icon: <HomeIcon />, label: 'Home' },
        { id: 'practices', icon: <PracticesIcon />, label: 'Practices' },
        { id: 'mood', icon: <MoodIcon />, label: 'Check-in' },
        { id: 'profile', icon: <ProfileIcon />, label: 'Profile' }
    ];

    return (
        <nav className="footer-nav">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => setPage(item.id)}
                    aria-label={item.label}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};


const App = () => {
    const [page, setPage] = useState('home');
    const { theme, toggleTheme } = useTheme();

    const onReminderFire = useCallback(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification('Mood Check-in', { body: 'Take 30 seconds to log how you feel.' }); } catch {}
        } else {
             alert('Time for your Mood Check-in 🌡️');
        }
    }, []);

    useReminderTicker(onReminderFire);

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <HomeScreen setPage={setPage} />;
            case 'practices':
                return <PracticesLibrary />;
            case 'mood':
                return <MoodThermometer setPage={setPage} />;
            case 'audio':
                return <AudioJourneyHub setPage={setPage} />;
            case 'journal':
                return <JournalingHub />;
            case 'profile':
                return <ProfileScreen setPage={setPage} theme={theme} toggleTheme={toggleTheme} />;
            case 'backup':
                 return <BackupExportCenter setPage={setPage} />;
            case 'reminders':
                 return <RemindersScreen setPage={setPage} />;
            default:
                return <HomeScreen setPage={setPage} />;
        }
    };
    
    const contentKey = useMemo(() => `${page}-${Date.now()}`, [page]);

    return (
        <>
            <main className="main-content" key={contentKey}>
                {renderPage()}
            </main>
            <FooterNav activePage={page} setPage={setPage} />
            <div className="disclaimer">
                Soul Refinery is a supportive tool and not a substitute for professional medical advice.
            </div>
        </>
    );
};

const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);