import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInsightSubjectStyle } from '../utils/colorUtils';
import PublishedIdChip from './PublishedIdChip';
import ProposedChip from './ProposedChip';
import PublishedTagChip from './PublishedTagChip';
import CategoryChip from './CategoryChip';
import AnswerCountChip from './AnswerCountChip';

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
  originalAnswer?: string | null;
}

interface QuestionDetailsPayload {
  id: number; // Question model ID
  inspirationId: number; // ID of the root Inspiration Insight
  questionType: string; // e.g., SINGLE_CHOICE
  questionText: string; // Specific question text from Question model
  originalQuestion?: string | null;
  isImageQuestion?: boolean;
  publishedId: string | null; // Published ID if the question was previously published
  proposedQuestion: string | null; // The original proposed question text if this was generated from a proposal
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
// interface RelatedAnswerInsightDisplay extends PrismaInsight {} // Removed - not used

// Interface for the question data from the new API
interface QuestionData {
  id: number;
  questionText: string;
  originalQuestion?: string | null;
  isImageQuestion?: boolean;
  questionType: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  inspiration: PrismaInsight;
  answers: {
    id: number;
    answerText: string;
    originalAnswer?: string | null;
    linkedAnswerInsight: PrismaInsight | null;
  }[];
  category: CategoryInfo;
}

// --- End Data Interfaces ---

interface QuestionViewProps {
  questionId: number; // Changed from insightId to questionId
  totalQuestionsInCategory: number; // For X of Y display (list of questions)
  currentQuestionIndex: number; // For X of Y display and navigation (index in questions list)
  onNavigateQuestion: (direction: 'next' | 'prev') => void;
  onSkipQuestion: () => void;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
}

// Add interface for related questions (similar to InsightTable)
interface RelatedQuestion {
  id: number;
  questionText: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  category: CategoryInfo;
}

const QuestionView: React.FC<QuestionViewProps> = ({
  questionId, // Changed from insightId
  totalQuestionsInCategory,
  currentQuestionIndex,
  onNavigateQuestion,
  onSkipQuestion,
  onCategoryClick,
}) => {
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState<QuestionData | null>(null); // Changed from fullContext
  const [loadingQuestionContext, setLoadingQuestionContext] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredAnswerOptionId, setHoveredAnswerOptionId] = useState<number | null>(null);
  const [hoveredPrevButton, setHoveredPrevButton] = useState<boolean>(false);
  const [hoveredNextButton, setHoveredNextButton] = useState<boolean>(false);
  const [canDeleteAnswers, setCanDeleteAnswers] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<{ type: 'question' | 'answer'; id: number } | null>(null);
  
  // Add state for insight question counts and mappings
  const [insightAnswerCounts, setInsightAnswerCounts] = useState<Map<number, number>>(new Map());
  const [insightToQuestionsMap, setInsightToQuestionsMap] = useState<Map<number, RelatedQuestion[]>>(new Map());

  useEffect(() => {
    if (!questionId) return;
    setError(null);

    const fetchQuestionData = async () => {
      try {
        setLoadingQuestionContext(true);
        const [questionResponse, countResponse] = await Promise.all([
          fetch(`/api/questions/${questionId}`),
          fetch(`/api/questions/${questionId}/answer-count`)
        ]);
        
        if (!questionResponse.ok) {
            const errorData = await questionResponse.json().catch(() => ({ message: `HTTP error! status: ${questionResponse.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${questionResponse.status}`);
        }
        
        const data: QuestionData = await questionResponse.json();
        setQuestionData(data);
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setCanDeleteAnswers(countData.canDeleteAnswers);
        }
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('An unknown error occurred while fetching question data');
        setQuestionData(null);
      } finally {
        setLoadingQuestionContext(false);
      }
    };

    fetchQuestionData();
  }, [questionId]); // Changed from insightId

  // Add effect to fetch insight counts when question data is available
  useEffect(() => {
    if (!questionData) return;

    const fetchInsightCounts = async () => {
      try {
        // Get all unique insight IDs from the current question's answers
        const insightIds = questionData.answers
          .filter(answer => answer.linkedAnswerInsight)
          .map(answer => answer.linkedAnswerInsight!.id);
        
        console.log('Question data:', questionData);
        console.log('Insight IDs found:', insightIds);
        
        if (insightIds.length === 0) return;

        // Fetch questions that use these insights from the same category
        const response = await fetch(`/api/categories/${questionData.category.id}/questions`);
        if (!response.ok) return; // Fail silently for counts
        
        const allQuestions: QuestionData[] = await response.json();
        console.log('All questions in category:', allQuestions.length);
        console.log('First question structure:', allQuestions[0]);
        
        // Build mappings of insight ID to questions that use it
        const insightToQuestionsMap = new Map<number, RelatedQuestion[]>();
        const insightCounts = new Map<number, number>();
        
        allQuestions.forEach(question => {
          question.answers.forEach(answer => {
            // The API returns 'insight' not 'linkedAnswerInsight' for the category questions endpoint
            const answerInsight = (answer as any).insight || answer.linkedAnswerInsight;
            if (answerInsight) {
              const insightId = answerInsight.id;
              
              if (!insightToQuestionsMap.has(insightId)) {
                insightToQuestionsMap.set(insightId, []);
              }
              
              const questionsList = insightToQuestionsMap.get(insightId)!;
              // Add question if not already present
              if (!questionsList.find(q => q.id === question.id)) {
                questionsList.push({
                  id: question.id,
                  questionText: question.questionText,
                  publishedId: question.publishedId,
                  proposedQuestion: question.proposedQuestion,
                  category: question.category
                });
              }
            }
          });
        });
        
        // Set counts
        insightToQuestionsMap.forEach((questions, insightId) => {
          insightCounts.set(insightId, questions.length);
        });
        
        console.log('Insight counts:', Array.from(insightCounts.entries()));
        console.log('Insight to questions map:', Array.from(insightToQuestionsMap.entries()));
        
        setInsightToQuestionsMap(insightToQuestionsMap);
        setInsightAnswerCounts(insightCounts);
      } catch (e) {
        // Fail silently for counts - they're not critical
        console.warn('Failed to fetch insight counts:', e);
      }
    };

    fetchInsightCounts();
  }, [questionData]);

  useEffect(() => {
    if (hoveredAnswerOptionId !== null) {
      const element = document.getElementById(`answer-insight-item-${hoveredAnswerOptionId}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [hoveredAnswerOptionId]);

  const handleAnswerHover = (option: QuestionData['answers'][0] | null) => {
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

  // Add function to handle question navigation from AnswerCountChip
  const handleQuestionNavigation = async (questionId: number, categoryId: number) => {
    try {
      // Navigate to the question using the proper route format
      navigate(`/categories/${categoryId}/questions/${questionId}`);
    } catch (error) {
      console.error('Failed to navigate to question:', error);
    }
  };

  // Add delete functions
  const handleDeleteQuestion = async () => {
    if (!questionData || deleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this question? This will also delete the inspiration insight and cannot be undone.');
    if (!confirmed) return;
    
    try {
      setDeleting({ type: 'question', id: questionData.id });
      const response = await fetch(`/api/questions/${questionData.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Navigate back or refresh the parent view
      onSkipQuestion();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAnswer = async (answerId: number) => {
    if (!questionData || deleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this answer? This will also delete the associated insight and cannot be undone.');
    if (!confirmed) return;
    
    try {
      setDeleting({ type: 'answer', id: answerId });
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the question data
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete answer:', error);
      alert('Failed to delete answer: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  if (loadingQuestionContext) return <p>Loading question context...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!questionData) {
    return <p>Question data is not available.</p>;
  }

  // Primary question text from Question model, fallback to Inspiration Insight's text
  const displayQuestionText = questionData.questionText || questionData.inspiration.insightText;
  const options = questionData.answers;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '20px', padding: '10px', width: '100%', maxWidth: '100vw', boxSizing: 'border-box', paddingBottom: '50vh' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {questionData.isImageQuestion ? '🖼️' : '💬'}
              Question {currentQuestionIndex + 1} of {totalQuestionsInCategory}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {questionData.publishedId && (
                <PublishedIdChip publishedId={questionData.publishedId} />
              )}
              {questionData.proposedQuestion && !questionData.publishedId && (
                <ProposedChip />
              )}
              <button
                onClick={handleDeleteQuestion}
                disabled={deleting?.type === 'question'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  fontSize: '16px',
                  cursor: deleting?.type === 'question' ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  borderRadius: '3px',
                  opacity: deleting?.type === 'question' ? 0.5 : 0.7,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (deleting?.type !== 'question') {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (deleting?.type !== 'question') {
                    e.currentTarget.style.opacity = '0.7';
                  }
                }}
                title="Delete question"
              >
                {deleting?.type === 'question' ? '⏳' : '✕'}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 'auto', paddingBottom: '20px' }}>
            <h3 style={{ margin: 0, marginBottom: '10px' }}>{displayQuestionText}</h3>
            {questionData.proposedQuestion && (
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  backgroundColor: '#ffc0cb',
                  color: '#000',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '400',
                  display: 'inline-block',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  lineHeight: '1.3'
                }}>
                  {questionData.proposedQuestion}
                </span>
              </div>
            )}

            {questionData.originalQuestion && questionData.originalQuestion !== questionData.questionText && (
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  backgroundColor: '#e0e0e0',
                  color: '#000',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '400',
                  display: 'inline-block',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  lineHeight: '1.3'
                }}>
                  {questionData.originalQuestion}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {options.map((option) => {
              const isHovered = hoveredAnswerOptionId === option.id;
              const isDeleting = deleting?.type === 'answer' && deleting?.id === option.id;
              return (
                <div key={option.id} style={{ position: 'relative', marginBottom: '6px' }}>
                  <button 
                    onMouseEnter={() => handleAnswerHover(option)}
                    onMouseLeave={() => handleAnswerHover(null)}
                    style={{
                      padding: '15px',
                      paddingRight: canDeleteAnswers ? '50px' : '15px',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: isHovered ? '2px solid #007bff' : '2px solid transparent',
                      backgroundColor: isHovered ? '#e7f3ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div>
                      {option.answerText}
                      {option.originalAnswer && option.originalAnswer !== option.answerText && (
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          fontStyle: 'italic',
                          marginTop: '4px',
                          textAlign: 'left'
                        }}>
                          {option.originalAnswer}
                        </div>
                      )}
                    </div>
                  </button>
                  {canDeleteAnswers && (
                    <button
                      onClick={() => handleDeleteAnswer(option.id)}
                      disabled={isDeleting}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        fontSize: '14px',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        padding: '4px',
                        borderRadius: '3px',
                        opacity: isDeleting ? 0.5 : 0.7,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeleting) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeleting) {
                          e.currentTarget.style.opacity = '0.7';
                        }
                      }}
                      title="Delete answer"
                    >
                      {isDeleting ? '⏳' : '✕'}
                    </button>
                  )}
                </div>
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
        <div style={{ flex: 1, minWidth: 0 }}> 
          <h4>Details</h4>
          {questionData.inspiration && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f0f0' }}>
              <h5 style={{ marginTop: 0, marginBottom: '5px' }}>Original Inspiration:</h5>
              <div style={{ marginBottom: '5px' }}>
                <CategoryChip 
                  insightSubject={questionData.inspiration.category?.insightSubject || 'Unknown'}
                  categoryId={questionData.inspiration.category?.id}
                  onClick={onCategoryClick}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0 }}>{questionData.inspiration.insightText}</p>
                {questionData.inspiration.publishedTag && (
                  <PublishedTagChip publishedTag={questionData.inspiration.publishedTag} />
                )}
              </div>
            </div>
          )}
          {loadingQuestionContext ? (
            <p>Loading related answers...</p>
          ) : options && options.length > 0 ? (
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              {options.map(answer => {
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
                          <CategoryChip 
                            insightSubject={answer.linkedAnswerInsight.category?.insightSubject || 'Unknown'}
                            categoryId={answer.linkedAnswerInsight.category?.id}
                            onClick={onCategoryClick}
                          />
                        </div>
                        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontStyle: 'italic', color: '#555', margin: 0, display: 'flex', alignItems: 'center' }}>
                            <AnswerCountChip 
                              count={insightAnswerCounts.get(answer.linkedAnswerInsight.id) || 0}
                              relatedQuestions={insightToQuestionsMap.get(answer.linkedAnswerInsight.id) || []}
                              onQuestionClick={handleQuestionNavigation}
                            />
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