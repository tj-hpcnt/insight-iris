import React, { useEffect, useState } from 'react';

// --- Data Interfaces based on backend schema and new API payload ---
interface PrismaInsight {
  id: number;
  categoryId: number;
  insightText: string;
  source: string; // 'INSPIRATION', 'ANSWER', 'DESCRIPTOR'
  generationOrder?: number | null;
  // ... other fields from Prisma Insight model if needed
}

interface AnswerOptionPayload {
  id: number; // Answer model ID
  answerText: string;
  linkedAnswerInsight: PrismaInsight | null; // Detailed insight for this answer option
}

interface QuestionDetailsPayload {
  id: number; // Question model ID
  inspirationId: number; // ID of the root Inspiration Insight
  questionType: string; // e.g., SINGLE_CHOICE
  questionText: string; // Specific question text from Question model
  answers: AnswerOptionPayload[];
}

// This is the main structure returned by /api/insights/:insightId
interface FullQuestionContextPayload {
  retrievedById: number;
  initialInsightDetails: PrismaInsight; // Details of the insight ID that was fetched
  inspirationInsightDetails: PrismaInsight | null; // The root INSPIRATION insight for the question
  questionDetails: QuestionDetailsPayload | null; // The full question structure
}

// Interface for related answer insights (for the right panel)
// This remains the same as before, an array of PrismaInsight where source is ANSWER
interface RelatedAnswerInsightDisplay extends PrismaInsight {}

// --- End Data Interfaces ---

interface QuestionViewProps {
  insightId: number; // The ID of the insight to fetch context for (can be inspiration or answer)
  totalQuestionsInCategory: number; // For X of Y display (list of INSPIRATION insights)
  currentQuestionIndex: number; // For X of Y display and navigation (index in INSPIRATION insights list)
  onNavigateQuestion: (direction: 'next' | 'prev') => void;
  onSkipQuestion: () => void;
}

const QuestionView: React.FC<QuestionViewProps> = ({
  insightId,
  totalQuestionsInCategory,
  currentQuestionIndex,
  onNavigateQuestion,
  onSkipQuestion,
}) => {
  const [fullContext, setFullContext] = useState<FullQuestionContextPayload | null>(null);
  const [loadingQuestionContext, setLoadingQuestionContext] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!insightId) return;
    setError(null);

    const fetchFullQuestionContext = async () => {
      try {
        setLoadingQuestionContext(true);
        const response = await fetch(`/api/insights/${insightId}/question-details`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        const data: FullQuestionContextPayload = await response.json();
        setFullContext(data);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('An unknown error occurred while fetching question context');
        setFullContext(null);
      } finally {
        setLoadingQuestionContext(false);
      }
    };

    fetchFullQuestionContext();
  }, [insightId]);

  const handleAnswerSelect = (option: AnswerOptionPayload) => {
    console.log(`Answer selected: ${option.answerText}`);
    if (option.linkedAnswerInsight) {
      console.log(`Linked Answer Insight ID: ${option.linkedAnswerInsight.id}, Text: ${option.linkedAnswerInsight.insightText}`);
      // TODO: Implement navigation to this detailed answer insight if needed, or display it.
    }
    // TODO: Implement answer submission logic
  };

  if (loadingQuestionContext) return <p>Loading question context...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!fullContext || !fullContext.questionDetails || !fullContext.inspirationInsightDetails) {
    return <p>Question data is not available or the context is incomplete.</p>;
  }

  // Primary question text from Question model, fallback to Inspiration Insight's text
  const displayQuestionText = fullContext.questionDetails.questionText || fullContext.inspirationInsightDetails.insightText;
  const options = fullContext.questionDetails.answers;

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      {/* Simulated Mobile Screen */}
      <div style={{
        width: '375px',
        minHeight: '600px',
        border: '1px solid #ccc',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {/* currentQuestionIndex and totalQuestionsInCategory are for the list of INSPIRATION insights */}
          Question {currentQuestionIndex + 1} of {totalQuestionsInCategory}
        </div>
        <div style={{ marginBottom: 'auto', paddingBottom: '20px' }}>
          <h3>{displayQuestionText}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((option) => (
            <button 
              key={option.id} 
              onClick={() => handleAnswerSelect(option)}
              style={{
                padding: '15px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {option.answerText}
            </button>
          ))}
        </div>
        <button 
            onClick={onSkipQuestion} 
            style={{ marginTop: 'auto', paddingTop:'20px', padding: '10px', cursor: 'pointer' }}
        >
            Skip
        </button>
      </div>

      {/* Related Answer Insights */}
      <div style={{ flex: 1, maxHeight: '812px', overflowY: 'auto' }}>
        <h4>Related Answer Insights (for this category)</h4>
        {loadingQuestionContext ? (
          <p>Loading related answers...</p>
        ) : fullContext?.questionDetails?.answers.length > 0 ? (
          <ul>
            {fullContext.questionDetails.answers.map(answer => (
              <li key={answer.id}>
                <h5>{answer.linkedAnswerInsight?.insightText || 'No insight available'}</h5>
              </li>
            ))}
          </ul>
        ) : (
          <p>No related answer insights found for this category.</p>
        )}
      </div>

      {/* Navigation Arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px'}}>
        <button onClick={() => onNavigateQuestion('prev')} disabled={currentQuestionIndex === 0}>
          &uarr; Previous Question
        </button>
        <button onClick={() => onNavigateQuestion('next')} disabled={currentQuestionIndex >= totalQuestionsInCategory - 1}>
          Next Question &darr;
        </button>
      </div>
    </div>
  );
};

export default QuestionView; 