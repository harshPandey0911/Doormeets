import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiPlayCircle, FiAward, FiLoader } from 'react-icons/fi';
import api from '../../../../services/api';

const TrainingModule = ({ formData, setFormData, onNext, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  const [videoWatched, setVideoWatched] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchTrainingData = async () => {
      try {
        const { data } = await api.get('/public/training-data');
        if (data.success) {
          const activeVideos = data.videos || [];
          const activeQuestions = data.questions || [];
          
          if (activeVideos.length === 0 && activeQuestions.length === 0) {
            // No training required, skip this step
            setFormData(prev => ({
              ...prev,
              training: {
                status: 'completed',
                score: 100,
                attemptCount: 1,
                totalQuestions: 0,
                correctAnswers: 0,
                skipped: true
              }
            }));
            onNext();
            return;
          }
          
          setVideos(activeVideos);
          
          // Map questions
          const mappedQuestions = activeQuestions.map((q) => {
            const correctIndex = q.options.findIndex(o => o.isCorrect);
            return {
              id: q._id,
              text: q.question,
              options: q.options.map(o => o.text),
              correct: correctIndex !== -1 ? correctIndex : 0
            };
          });
          
          setQuestions(mappedQuestions);
          
          // If no videos but questions exist, skip video step
          if (activeVideos.length === 0) {
            setVideoWatched(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch training data", error);
        // Fallback: skip training on error
        onNext();
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrainingData();
  }, [onNext, setFormData]);

  const handleAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentQuestion]: optionIndex });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct) {
        score++;
      }
    });
    
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 100;

    setFormData({
      ...formData,
      training: {
        status: 'completed',
        score: percentage,
        attemptCount: 1,
        totalQuestions: questions.length,
        correctAnswers: score
      }
    });
    
    setShowResults(true);
  };

  const handleContinue = () => {
    onNext();
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 border border-gray-100 flex flex-col items-center justify-center p-12">
        <FiLoader className="text-4xl text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Checking training requirements...</p>
      </div>
    );
  }

  // Fallback if data loading failed but didn't redirect
  if (videos.length === 0 && questions.length === 0) {
    return null;
  }

  const currentVideo = videos.length > 0 ? videos[0] : null;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden mt-8 border border-gray-100">
      <div className="p-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <FiAward className="text-3xl text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800 text-center">Vendor Training</h2>
        </div>
        <p className="text-center text-gray-500 mb-8">Watch the video and answer a few questions to complete your profile.</p>

        {!videoWatched ? (
          <div className="space-y-6">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative group flex items-center justify-center">
              {/* Placeholder for YouTube Video */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <button 
                  onClick={() => {
                    setVideoWatched(true);
                    if (questions.length === 0) {
                      calculateResults();
                    }
                  }}
                  className="w-16 h-16 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm transition-all transform hover:scale-110"
                >
                  <FiPlayCircle className="text-white text-4xl" />
                </button>
              </div>
              <img 
                src={currentVideo?.thumbnailUrl || "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"} 
                alt="Training Video Thumbnail" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-bold text-lg drop-shadow-md">{currentVideo?.title || 'Professional Guidelines'}</h3>
                <p className="text-sm opacity-90 drop-shadow-md">{currentVideo?.description || 'Watch this video to proceed'}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onBack}
                className="py-2 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setVideoWatched(true);
                  if (questions.length === 0) {
                    calculateResults();
                  }
                }}
                className="py-2 px-6 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md"
              >
                I have watched the video
              </button>
            </div>
          </div>
        ) : !showResults ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">Question {currentQuestion + 1} of {questions.length}</h3>
              <span className="text-sm font-medium px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                {Math.round(((currentQuestion) / questions.length) * 100)}% Completed
              </span>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <h4 className="text-lg font-medium text-gray-800 mb-6">{questions[currentQuestion].text}</h4>
              
              <div className="space-y-3">
                {questions[currentQuestion].options.map((opt, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      answers[currentQuestion] === idx 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        answers[currentQuestion] === idx ? 'border-purple-600' : 'border-gray-400'
                      }`}>
                        {answers[currentQuestion] === idx && <div className="w-2.5 h-2.5 bg-purple-600 rounded-full"></div>}
                      </div>
                      <span className={answers[currentQuestion] === idx ? 'text-purple-900 font-medium' : 'text-gray-700'}>
                        {opt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setVideoWatched(false)}
                className="py-2 px-6 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Watch Video Again
              </button>
              <button
                type="button"
                onClick={handleNextQuestion}
                disabled={answers[currentQuestion] === undefined}
                className="py-2 px-8 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
              >
                {currentQuestion === questions.length - 1 ? 'Finish Test' : 'Next Question'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FiCheckCircle className="text-5xl text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Completed</h3>
              <p className="text-gray-600 mb-2">Your test has been submitted for admin review.</p>
              <div className="text-3xl font-black text-green-600 mb-6">{formData.training?.score}% Score</div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={handleContinue}
                className="py-3 px-8 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 shadow-lg transition-all"
              >
                Proceed to Verification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingModule;
