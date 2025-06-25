import React, { useEffect, useState, useRef } from 'react';
import { getInsightSubjectStyle } from '../utils/colorUtils';
import PublishedIdChip from './PublishedIdChip';
import PublishedTagChip from './PublishedTagChip';

// --- Data Interfaces based on backend schema and new API payload ---
interface CategoryInfo {
  id: number;
  category: string;
  subcategory: string;
  insightSubject: string;
}

interface PrismaInsight {
  id: number;
  categoryId: number;
  insightText: string;
  source: string; // 'INSPIRATION', 'ANSWER', 'DESCRIPTOR'
  generationOrder?: number | null;
  publishedTag?: string | null;
  category: CategoryInfo;
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
  publishedId: string | null; // Published ID if the question was previously published
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
  const [hoveredAnswerOptionId, setHoveredAnswerOptionId] = useState<number | null>(null);
  const [hoveredPrevButton, setHoveredPrevButton] = useState<boolean>(false);
  const [hoveredNextButton, setHoveredNextButton] = useState<boolean>(false);

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

  useEffect(() => {
    if (hoveredAnswerOptionId !== null) {
      const element = document.getElementById(`answer-insight-item-${hoveredAnswerOptionId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredAnswerOptionId]);

  const handleAnswerHover = (option: AnswerOptionPayload | null) => {
    if (option) {
      console.log(`Answer hovered: ${option.answerText}`);
      setHoveredAnswerOptionId(option.id);
      if (option.linkedAnswerInsight) {
        console.log(`Linked Answer Insight ID: ${option.linkedAnswerInsight.id}, Text: ${option.linkedAnswerInsight.insightText}`);
      }
      // TODO: Implement answer submission logic if needed on click eventually
    } else {
      setHoveredAnswerOptionId(null); // Clear hover when mouse leaves
    }
  };

  // New function to handle hover on detail items (for bidirectional highlighting)
  const handleDetailItemHover = (answerId: number | null) => {
    setHoveredAnswerOptionId(answerId);
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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '20px', padding: '10px', width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
      {/* Previous Question Button */}
      <button 
        onClick={() => onNavigateQuestion('prev')} 
        disabled={currentQuestionIndex === 0}
        style={{
          background: hoveredPrevButton ? '#777' : '#555',
          color: 'white',
          border: hoveredPrevButton ? '2px solid #999' : '2px solid transparent',
          padding: '20px 30px',
          fontSize: '24px',
          cursor: 'pointer',
          borderRadius: '10px',
          height: '550px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          flexShrink: 0,
          boxShadow: hoveredPrevButton ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={() => setHoveredPrevButton(true)}
        onMouseLeave={() => setHoveredPrevButton(false)}
      >
        &larr;
      </button>

      {/* Central Content Area (iPhone on left, Insights on right) */}
      <div style={{ display: 'flex', flex: 1, gap: '20px', alignItems: 'flex-start', minWidth: 0 }}>
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
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {/* currentQuestionIndex and totalQuestionsInCategory are for the list of INSPIRATION insights */}
            Question {currentQuestionIndex + 1} of {totalQuestionsInCategory}
          </div>
          <div style={{ marginBottom: 'auto', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{displayQuestionText}</h3>
              {fullContext.questionDetails.publishedId && (
                <PublishedIdChip publishedId={fullContext.questionDetails.publishedId} />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {options.map((option) => {
              const isHovered = hoveredAnswerOptionId === option.id;
              return (
                <button 
                  key={option.id} 
                  onMouseEnter={() => handleAnswerHover(option)}
                  onMouseLeave={() => handleAnswerHover(null)}
                  style={{
                    padding: '15px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: isHovered ? '2px solid #007bff' : '2px solid transparent',
                    backgroundColor: isHovered ? '#e7f3ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  {option.answerText}
                </button>
              );
            })}
          </div>
          <button 
              onClick={onSkipQuestion}
              style={{ marginTop: 'auto', paddingTop:'20px', padding: '10px', cursor: 'pointer' }}
          >
              Skip
          </button>
        </div>

        {/* Next Question Button (Now after iPhone, before Insights) */}
        <button 
          onClick={() => onNavigateQuestion('next')} 
          disabled={currentQuestionIndex >= totalQuestionsInCategory - 1}
          style={{
            background: hoveredNextButton ? '#777' : '#555',
            color: 'white',
            border: hoveredNextButton ? '2px solid #999' : '2px solid transparent',
            padding: '20px 30px',
            fontSize: '24px',
            cursor: 'pointer',
            borderRadius: '10px',
            height: '550px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            flexShrink: 0,
            boxShadow: hoveredNextButton ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={() => setHoveredNextButton(true)}
          onMouseLeave={() => setHoveredNextButton(false)}
        >
          &rarr;
        </button>

        {/* Related Answer Insights (Now to the very right, takes remaining space) */}
        <div style={{ flex: 1, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', minWidth: 0 }}> 
          <h4>Details</h4>
          {fullContext.inspirationInsightDetails && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f0f0' }}>
              <h5 style={{ marginTop: 0, marginBottom: '5px' }}>Original Inspiration:</h5>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0 }}>{fullContext.inspirationInsightDetails.insightText}</p>
                {fullContext.inspirationInsightDetails.publishedTag && (
                  <PublishedTagChip publishedTag={fullContext.inspirationInsightDetails.publishedTag} />
                )}
              </div>
            </div>
          )}
          {loadingQuestionContext ? (
            <p>Loading related answers...</p>
          ) : fullContext?.questionDetails?.answers && fullContext.questionDetails.answers.length > 0 ? (
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {fullContext.questionDetails.answers.map(answer => {
                const isHovered = hoveredAnswerOptionId === answer.id;
                return (
                  <li 
                    key={answer.id} 
                    id={`answer-insight-item-${answer.id}`}
                    onMouseEnter={() => handleDetailItemHover(answer.id)}
                    onMouseLeave={() => handleDetailItemHover(null)}
                    style={{
                      marginBottom: '15px', 
                      padding: '10px', 
                      border: isHovered ? '2px solid #007bff' : '2px solid transparent',
                      backgroundColor: isHovered ? '#e7f3ff' : 'transparent',
                      borderRadius: '5px',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {answer.linkedAnswerInsight ? (
                      <div style={{ position: 'relative' }}>
                        <div style={{ marginLeft: '20px', marginBottom: '5px' }}>
                          <span style={getInsightSubjectStyle(answer.linkedAnswerInsight.category?.insightSubject || 'Unknown')}>
                            {answer.linkedAnswerInsight.category?.insightSubject || 'Unknown'}
                          </span>
                        </div>
                        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontStyle: 'italic', color: '#555', margin: 0 }}>
                            ↪ {answer.linkedAnswerInsight.insightText}
                          </p>
                          {answer.linkedAnswerInsight.publishedTag && (
                            <PublishedTagChip publishedTag={answer.linkedAnswerInsight.publishedTag} />
                          )}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontStyle: 'italic', marginLeft: '20px', color: '#777' }}>↪ No linked insight available for this option.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No related answer insights found for this question's options.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionView;