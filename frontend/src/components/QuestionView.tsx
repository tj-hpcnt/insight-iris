import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionIdChip from './QuestionIdChip';
import PublishedTagChip from './PublishedTagChip';
import CategoryChip from './CategoryChip';
import AnswerCountChip from './AnswerCountChip';
import ShortInsightChip from './ShortInsightChip';

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
  shortInsightText?: string | null | undefined;
  source: string; // 'INSPIRATION', 'ANSWER', 'DESCRIPTOR'
  generationOrder?: number | null;
  publishedTag?: string | null;
  category: CategoryInfo;
  // ... other fields from Prisma Insight model if needed
}







// Interface for related answer insights (for the right panel)
// This remains the same as before, an array of PrismaInsight where source is ANSWER
// interface RelatedAnswerInsightDisplay extends PrismaInsight {} // Removed - not used

// Interface for compatibility comparison data
interface CompatibilityComparison {
  id: number;
  insightA: {
    id: number;
    insightText: string;
    shortInsightText?: string | null;
    category: {
      id: number;
      insightSubject: string;
    };
  };
  insightB: {
    id: number;
    insightText: string;
    shortInsightText?: string | null;
    category: {
      id: number;
      insightSubject: string;
    };
  };
  presentation?: {
    presentationTitle: string;
    conciseAText: string;
    conciseBText: string;
    importance: number;
  } | null;
}

// Interface for the question data from the new API
interface QuestionData {
  id: number;
  questionText: string;
  originalQuestion?: string | null;
  isImageQuestion?: boolean;
  questionType: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  persistentId: string; // Add persistentId field
  approved: boolean; // Add approved field
  firstDays: boolean; // Add firstDays field
  conversationStarter: boolean; // Add conversationStarter field
  inspiration: PrismaInsight;
  answers: {
    id: number;
    answerText: string;
    originalAnswer?: string | null;
    linkedAnswerInsight: PrismaInsight | null;
  }[];
  category: CategoryInfo;
  compatibilityComparisons: CompatibilityComparison[];
}

// Add interface for comments
interface Comment {
  id: number;
  questionId: number;
  text: string;
  username: string;
  createdAt: string;
}

// --- End Data Interfaces ---

// Editable text component for inline editing
interface EditableTextProps {
  fieldKey: string;
  value: string;
  editingFields: Set<string>;
  editedValues: Record<string, string>;
  onStartEdit: (fieldKey: string, currentValue: string) => void;
  onUpdateValue: (fieldKey: string, value: string) => void;
  onCancelEdit: (fieldKey: string) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const EditableText: React.FC<EditableTextProps> = ({
  fieldKey,
  value,
  editingFields,
  editedValues,
  onStartEdit,
  onUpdateValue,
  onCancelEdit,
  style = {},
  disabled = false
}) => {
  const isEditing = editingFields.has(fieldKey);
  const currentValue = isEditing ? (editedValues[fieldKey] || value) : value;
  
  const handleDoubleClick = () => {
    if (!disabled && !isEditing) {
      onStartEdit(fieldKey, value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        onCancelEdit(fieldKey);
      }
    }
    // Note: Enter key no longer ends editing - changes are buffered
  };

  const handleBlur = () => {
    // Note: Blur no longer ends editing - changes are buffered until save/discard
  };

  const baseStyle: React.CSSProperties = {
    ...style,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background-color 0.2s ease',
    backgroundColor: isEditing ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
    borderRadius: '4px',
    padding: isEditing ? '4px' : '0',
    border: isEditing ? '1px solid rgba(0, 123, 255, 0.3)' : '1px solid transparent',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    lineHeight: 'inherit',
    width: '100%',
    minHeight: '1.2em',
    resize: isEditing ? 'vertical' : 'none'
  };

  // Calculate proper textarea size
  const calculateRows = (text: string): number => {
    if (!text || text.trim().length === 0) return 2;
    
    const lines = text.split('\n');
    const wrappedLines = lines.reduce((total, line) => {
      // Estimate line wrapping based on typical character width (adjust as needed)
      const estimatedCharsPerLine = 50; // This can be adjusted based on actual width
      return total + Math.max(1, Math.ceil(line.length / estimatedCharsPerLine));
    }, 0);
    return Math.max(2, Math.min(10, wrappedLines)); // Min 2 rows, max 10 rows
  };

  if (isEditing) {
    return (
      <textarea
        value={currentValue}
        onChange={(e) => onUpdateValue(fieldKey, e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={handleBlur}
        style={{
          ...baseStyle,
          minHeight: 'auto',
          height: 'auto'
        }}
        autoFocus
        rows={calculateRows(currentValue)}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={baseStyle}
      title={disabled ? undefined : "Double-click to edit"}
    >
      {currentValue || (style.fontStyle === 'italic' ? 'No text available' : '')}
    </div>
  );
};

// --- End Components ---

interface QuestionViewProps {
  questionId: number; // Changed from insightId to questionId
  totalQuestionsInCategory: number; // For X of Y display (list of questions)
  currentQuestionIndex: number; // For X of Y display and navigation (index in questions list)
  onNavigateQuestion: (direction: 'next' | 'prev') => void;
  onSkipQuestion: () => void;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  user: { username: string; role: string } | null;
}

// Add interface for related questions (similar to InsightTable)
interface RelatedQuestion {
  id: number;
  questionText: string;
  persistentId: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  isImageQuestion: boolean;
  answers?: {
    id: number;
    answerText: string;
  }[];
  category: CategoryInfo;
}

const QuestionView: React.FC<QuestionViewProps> = ({
  questionId, // Changed from insightId
  totalQuestionsInCategory,
  currentQuestionIndex,
  onNavigateQuestion,
  onSkipQuestion,
  onCategoryClick,
  user,
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
  
  // Add state for approval, firstDays, conversationStarter, and comments
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isFirstDays, setIsFirstDays] = useState<boolean>(false);
  const [isConversationStarter, setIsConversationStarter] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [togglingApproval, setTogglingApproval] = useState<boolean>(false);
  const [togglingFirstDays, setTogglingFirstDays] = useState<boolean>(false);
  const [togglingConversationStarter, setTogglingConversationStarter] = useState<boolean>(false);
  
  // Add state for comment editing and deleting
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>('');
  const [updatingComment, setUpdatingComment] = useState<boolean>(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  
  // Add state for insight question counts and mappings
  const [insightAnswerCounts, setInsightAnswerCounts] = useState<Map<number, number>>(new Map());
  const [insightToQuestionsMap, setInsightToQuestionsMap] = useState<Map<number, RelatedQuestion[]>>(new Map());
  
  // Add state for overlapping questions
  const [overlappingQuestions, setOverlappingQuestions] = useState<RelatedQuestion[]>([]);
  const [loadingOverlappingQuestions, setLoadingOverlappingQuestions] = useState<boolean>(false);

  // Add state for edit functionality
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [discarding, setDiscarding] = useState<boolean>(false);

  // Add helper function for relative time formatting
  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  };

  // Add helper functions for edit functionality
  const startEdit = (fieldKey: string, currentValue: string) => {
    const newEditingFields = new Set(editingFields);
    newEditingFields.add(fieldKey);
    setEditingFields(newEditingFields);
    setEditedValues(prev => ({
      ...prev,
      [fieldKey]: currentValue
    }));
  };

  const updateEditValue = (fieldKey: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    // Check if this creates a change
    const hasCurrentChanges = Object.entries({...editedValues, [fieldKey]: value})
      .some(([key, val]) => val !== getOriginalValue(key));
    setHasChanges(hasCurrentChanges);
  };

  const getOriginalValue = (fieldKey: string): string => {
    if (!questionData) return '';
    
    if (fieldKey === 'question') return questionData.questionText;
    if (fieldKey === 'inspiration-insight') return questionData.inspiration.insightText;
    if (fieldKey === 'inspiration-short') return questionData.inspiration.shortInsightText || '';
    
    // For answer and answer insight fields
    const [type, id] = fieldKey.split('-');
    if (type === 'answer') {
      const answer = questionData.answers.find(a => a.id.toString() === id);
      return answer?.answerText || '';
    }
    if (type === 'insight') {
      const answer = questionData.answers.find(a => a.id.toString() === id);
      return answer?.linkedAnswerInsight?.insightText || '';
    }
    if (type === 'short') {
      const answer = questionData.answers.find(a => a.id.toString() === id);
      return answer?.linkedAnswerInsight?.shortInsightText || '';
    }
    
    return '';
  };

  const cancelEdit = (fieldKey: string) => {
    const newEditingFields = new Set(editingFields);
    newEditingFields.delete(fieldKey);
    setEditingFields(newEditingFields);
    
    const newEditedValues = { ...editedValues };
    delete newEditedValues[fieldKey];
    setEditedValues(newEditedValues);
    
    // Recheck if there are still changes
    const hasCurrentChanges = Object.entries(newEditedValues)
      .some(([key, val]) => val !== getOriginalValue(key));
    setHasChanges(hasCurrentChanges);
  };

  const handleSave = async () => {
    if (!questionData || saving) return;
    
    try {
      setSaving(true);
      
      // Build updates for different entities
      const updates: any = {
        questionUpdates: {},
        answerUpdates: {},
        insightUpdates: {}
      };
      
      Object.entries(editedValues).forEach(([fieldKey, value]) => {
        if (value === getOriginalValue(fieldKey)) return; // Skip unchanged values
        
        if (fieldKey === 'question') {
          updates.questionUpdates.questionText = value;
        } else if (fieldKey === 'inspiration-insight') {
          updates.insightUpdates[questionData.inspiration.id] = {
            insightText: value
          };
        } else if (fieldKey === 'inspiration-short') {
          updates.insightUpdates[questionData.inspiration.id] = {
            ...updates.insightUpdates[questionData.inspiration.id],
            shortInsightText: value
          };
        } else {
          const [type, id] = fieldKey.split('-');
          if (type === 'answer') {
            updates.answerUpdates[id] = { answerText: value };
          } else if (type === 'insight') {
            const answer = questionData.answers.find(a => a.id.toString() === id);
            if (answer?.linkedAnswerInsight) {
              updates.insightUpdates[answer.linkedAnswerInsight.id] = {
                insightText: value
              };
            }
          } else if (type === 'short') {
            const answer = questionData.answers.find(a => a.id.toString() === id);
            if (answer?.linkedAnswerInsight) {
              updates.insightUpdates[answer.linkedAnswerInsight.id] = {
                ...updates.insightUpdates[answer.linkedAnswerInsight.id],
                shortInsightText: value
              };
            }
          }
        }
      });
      
      // Send updates to API
      const response = await fetch(`/api/questions/${questionData.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Clear editing state and refresh the question data
      setEditingFields(new Set());
      setEditedValues({});
      setHasChanges(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (discarding) return;
    
    setDiscarding(true);
    setEditingFields(new Set());
    setEditedValues({});
    setHasChanges(false);
    
    // Reload the page to get fresh data
    window.location.reload();
  };

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
        setIsApproved(data.approved); // Set approval state
        setIsFirstDays(data.firstDays); // Set firstDays state
        setIsConversationStarter(data.conversationStarter); // Set conversationStarter state
        
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

  // Add effect to load comments
  useEffect(() => {
    if (!questionId) return;

    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/questions/${questionId}/comments`);
        if (response.ok) {
          const commentsData = await response.json();
          setComments(commentsData);
        }
      } catch (e) {
        console.warn('Failed to load comments:', e);
      }
    };

    fetchComments();
  }, [questionId]);

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
                  persistentId: question.persistentId,
                  publishedId: question.publishedId,
                  proposedQuestion: question.proposedQuestion,
                  isImageQuestion: question.isImageQuestion || false,
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

  // Add effect to fetch overlapping questions
  useEffect(() => {
    if (!questionId) return;

    const fetchOverlappingQuestions = async () => {
      try {
        setLoadingOverlappingQuestions(true);
        const response = await fetch(`/api/questions/${questionId}/overlapping`);
        if (response.ok) {
          const overlappingData = await response.json();
          setOverlappingQuestions(overlappingData);
        } else {
          // Silently fail - overlapping questions are not critical
          setOverlappingQuestions([]);
        }
      } catch (e) {
        // Silently fail - overlapping questions are not critical
        console.warn('Failed to fetch overlapping questions:', e);
        setOverlappingQuestions([]);
      } finally {
        setLoadingOverlappingQuestions(false);
      }
    };

    fetchOverlappingQuestions();
  }, [questionId]);

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

  // Add approval and comment handler functions
  const handleApprovalToggle = async () => {
    if (!questionData || togglingApproval) return;
    
    try {
      setTogglingApproval(true);
      const response = await fetch(`/api/questions/${questionData.id}/approval`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setIsApproved(result.approved);
    } catch (error) {
      console.error('Failed to toggle approval:', error);
      alert('Failed to toggle approval: ' + (error as Error).message);
    } finally {
      setTogglingApproval(false);
    }
  };

  const handleFirstDaysToggle = async () => {
    if (!questionData || togglingFirstDays) return;
    
    try {
      setTogglingFirstDays(true);
      const response = await fetch(`/api/questions/${questionData.id}/first-days`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setIsFirstDays(result.firstDays);
    } catch (error) {
      console.error('Failed to toggle first days:', error);
      alert('Failed to toggle first days: ' + (error as Error).message);
    } finally {
      setTogglingFirstDays(false);
    }
  };

  const handleConversationStarterToggle = async () => {
    if (!questionData || togglingConversationStarter) return;
    
    try {
      setTogglingConversationStarter(true);
      const response = await fetch(`/api/questions/${questionData.id}/conversation-starter`, {
        method: 'PUT'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setIsConversationStarter(result.conversationStarter);
    } catch (error) {
      console.error('Failed to toggle conversation starter:', error);
      alert('Failed to toggle conversation starter: ' + (error as Error).message);
    } finally {
      setTogglingConversationStarter(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!questionData || submittingComment || !newCommentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/questions/${questionData.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newCommentText.trim() })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const newComment = await response.json();
      setComments(prev => [newComment, ...prev]); // Add to top since we sort by desc
      setNewCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment: ' + (error as Error).message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Add comment edit and delete handlers
  const handleEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!questionData || updatingComment || !editCommentText.trim()) return;
    
    try {
      setUpdatingComment(true);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: editCommentText.trim() })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const updatedComment = await response.json();
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment: ' + (error as Error).message);
    } finally {
      setUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!questionData || deletingCommentId === commentId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;
    
    try {
      setDeletingCommentId(commentId);
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment: ' + (error as Error).message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Add delete overlapping question function
  const handleDeleteOverlappingQuestion = async (questionId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this overlapping question? This cannot be undone.');
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Remove the deleted question from the overlapping questions list
      setOverlappingQuestions(prev => prev.filter(q => q.id !== questionId));
    } catch (error) {
      console.error('Failed to delete overlapping question:', error);
      alert('Failed to delete question: ' + (error as Error).message);
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
          alignSelf: 'flex-start',
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
              &nbsp;{currentQuestionIndex + 1} of {totalQuestionsInCategory}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* First Days (d0) toggle button */}
              <button
                onClick={handleFirstDaysToggle}
                disabled={togglingFirstDays}
                style={{
                  background: 'none',
                  border: isFirstDays ? '2px solid #6c757d' : '2px solid #ccc',
                  color: isFirstDays ? 'white' : '#666',
                  fontSize: '12px',
                  cursor: togglingFirstDays ? 'not-allowed' : 'pointer',
                  padding: '6px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isFirstDays ? '#6c757d' : 'transparent',
                  opacity: togglingFirstDays ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  fontWeight: isFirstDays ? 'bold' : 'normal',
                  minWidth: '24px',
                  height: '24px'
                }}
                onMouseEnter={(e) => {
                  if (!togglingFirstDays) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!togglingFirstDays) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title={isFirstDays ? 'Remove from first days' : 'Mark as first days question'}
              >
                {togglingFirstDays ? '⏳' : 'd0'}
              </button>

              {/* Thumbs up approval button */}
              <button
                onClick={handleApprovalToggle}
                disabled={togglingApproval}
                style={{
                  background: 'none',
                  border: isApproved ? '2px solid #28a745' : '2px solid #ccc',
                  color: isApproved ? '#28a745' : '#666',
                  fontSize: '10px',
                  cursor: togglingApproval ? 'not-allowed' : 'pointer',
                  padding: '6px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isApproved ? '#28a745' : 'transparent',
                  opacity: togglingApproval ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  minWidth: '24px',
                  height: '24px'
                }}
                onMouseEnter={(e) => {
                  if (!togglingApproval) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!togglingApproval) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title={isApproved ? 'Remove approval' : 'Approve question'}
              >
                {togglingApproval ? '⏳' : isApproved ? '👍' : '👍'}
              </button>

              {/* Conversation starter button */}
              <button
                onClick={handleConversationStarterToggle}
                disabled={togglingConversationStarter}
                style={{
                  background: 'none',
                  border: isConversationStarter ? '2px solid #17a2b8' : '2px solid #ccc',
                  color: isConversationStarter ? '#17a2b8' : '#666',
                  fontSize: '10px',
                  cursor: togglingConversationStarter ? 'not-allowed' : 'pointer',
                  padding: '6px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isConversationStarter ? '#17a2b8' : 'transparent',
                  opacity: togglingConversationStarter ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  minWidth: '24px',
                  height: '24px'
                }}
                onMouseEnter={(e) => {
                  if (!togglingConversationStarter) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!togglingConversationStarter) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title={isConversationStarter ? 'Remove conversation starter' : 'Mark as conversation starter'}
              >
                {togglingConversationStarter ? '⏳' : '🗣️'}
              </button>

              {/* Comment button */}
              <button
                onClick={() => setShowCommentModal(true)}
                style={{
                  background: 'none',
                  border: comments.length > 0 ? '2px solid #007bff' : '2px solid #ccc',
                  color: comments.length > 0 ? '#007bff' : '#666',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '6px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: comments.length > 0 ? '#007bff' : 'transparent',
                  transition: 'all 0.2s ease',
                  minWidth: '24px',
                  height: '24px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={`${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
              >
                💬
              </button>
              
              {!isApproved && !hasChanges && (
                <button
                  onClick={handleDeleteQuestion}
                  disabled={deleting?.type === 'question'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    fontSize: '12px',
                    cursor: deleting?.type === 'question' ? 'not-allowed' : 'pointer',
                    padding: '6px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: deleting?.type === 'question' ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    minWidth: '24px',
                    height: '24px'
                  }}
                  onMouseEnter={(e) => {
                    if (deleting?.type !== 'question') {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deleting?.type !== 'question') {
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  title="Delete question"
                >
                  {deleting?.type === 'question' ? '⏳' : '✕'}
                </button>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 'auto', paddingBottom: '20px' }}>
            <h3 style={{ margin: 0, marginBottom: '10px' }}>
              <EditableText
                fieldKey="question"
                value={displayQuestionText}
                editingFields={editingFields}
                editedValues={editedValues}
                onStartEdit={startEdit}
                onUpdateValue={updateEditValue}
                onCancelEdit={cancelEdit}
                style={{ fontWeight: 'bold', fontSize: 'inherit' }}
              />
            </h3>
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
                      paddingRight: canDeleteAnswers && !hasChanges ? '50px' : '15px',
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
                      <EditableText
                        fieldKey={`answer-${option.id}`}
                        value={option.answerText}
                        editingFields={editingFields}
                        editedValues={editedValues}
                        onStartEdit={startEdit}
                        onUpdateValue={updateEditValue}
                        onCancelEdit={cancelEdit}
                        style={{ fontSize: 'inherit' }}
                        disabled={questionData.questionType === 'BINARY'}
                      />
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
                  {canDeleteAnswers && !hasChanges && (
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
            alignSelf: 'flex-start',
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
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}> 
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h4 style={{ margin: 0 }}>Details</h4>
              <QuestionIdChip 
                persistentId={questionData.persistentId}
                publishedId={questionData.publishedId}
                isProposed={!!questionData.proposedQuestion}
              />
              {hasChanges && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                  <button
                    onClick={handleDiscard}
                    disabled={discarding || saving}
                    style={{
                      background: 'none',
                      border: '2px solid #6c757d',
                      color: '#6c757d',
                      fontSize: '12px',
                      cursor: discarding || saving ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: discarding || saving ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      fontWeight: 'normal'
                    }}
                    onMouseEnter={(e) => {
                      if (!discarding && !saving) {
                        e.currentTarget.style.backgroundColor = '#6c757d';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!discarding && !saving) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6c757d';
                      }
                    }}
                    title="Discard changes"
                  >
                    {discarding ? '⏳' : 'Discard'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || discarding}
                    style={{
                      background: 'none',
                      border: '2px solid #28a745',
                      color: '#28a745',
                      fontSize: '12px',
                      cursor: saving || discarding ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: saving || discarding ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                      fontWeight: 'normal'
                    }}
                    onMouseEnter={(e) => {
                      if (!saving && !discarding) {
                        e.currentTarget.style.backgroundColor = '#28a745';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving && !discarding) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#28a745';
                      }
                    }}
                    title="Save changes"
                  >
                    {saving ? '⏳' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            {(questionData.proposedQuestion || (questionData.originalQuestion && questionData.originalQuestion !== questionData.questionText)) && (
              <div style={{ maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questionData.proposedQuestion && (
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
                )}
                {questionData.originalQuestion && questionData.originalQuestion !== questionData.questionText && (
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
                )}
              </div>
            )}
          </div>
          {questionData.inspiration && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f0f0f0', textAlign: 'left' }}>
              <h5 style={{ marginTop: 0, marginBottom: '5px' }}>Original Inspiration:</h5>
              {questionData.inspiration.category?.id !== questionData.category.id && (
                <div style={{ marginBottom: '5px' }}>
                  <CategoryChip 
                    insightSubject={questionData.inspiration.category?.insightSubject || 'Unknown'}
                    categoryId={questionData.inspiration.category?.id}
                    onClick={onCategoryClick}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '10px' }}>
                <p style={{ margin: 0, flex: 1, textAlign: 'left' }}>
                  <EditableText
                    fieldKey="inspiration-insight"
                    value={questionData.inspiration.insightText}
                    editingFields={editingFields}
                    editedValues={editedValues}
                    onStartEdit={startEdit}
                    onUpdateValue={updateEditValue}
                    onCancelEdit={cancelEdit}
                    style={{ fontSize: 'inherit' }}
                  />
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  {questionData.inspiration.publishedTag && (
                    <PublishedTagChip publishedTag={questionData.inspiration.publishedTag} />
                  )}
                  <div style={{ cursor: 'pointer' }}>
                    <EditableText
                      fieldKey="inspiration-short"
                      value={questionData.inspiration.shortInsightText || ''}
                      editingFields={editingFields}
                      editedValues={editedValues}
                      onStartEdit={startEdit}
                      onUpdateValue={updateEditValue}
                      onCancelEdit={cancelEdit}
                      style={{ 
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: editingFields.has('inspiration-short') ? 'rgba(0, 123, 255, 0.1)' : '#e0e0e0',
                        color: '#000',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        maxWidth: '150px',
                        wordWrap: 'break-word',
                        lineHeight: '1.3',
                        minHeight: '1.3em'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {loadingQuestionContext ? (
            <p>Loading related answers...</p>
          ) : options && options.length > 0 ? (
            <ul style={{ listStyleType: 'none', paddingLeft: 0, textAlign: 'left' }}>
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
                        {answer.linkedAnswerInsight.category?.id !== questionData.category.id && (
                          <div style={{ marginBottom: '5px' }}>
                            <CategoryChip 
                              insightSubject={answer.linkedAnswerInsight.category?.insightSubject || 'Unknown'}
                              categoryId={answer.linkedAnswerInsight.category?.id}
                              onClick={onCategoryClick}
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: '10px' }}>
                          <p style={{ fontStyle: 'italic', color: '#555', margin: 0, display: 'flex', alignItems: 'center', flex: 1, textAlign: 'left' }}>
                            <AnswerCountChip 
                              count={insightAnswerCounts.get(answer.linkedAnswerInsight.id) || 0}
                              relatedQuestions={insightToQuestionsMap.get(answer.linkedAnswerInsight.id) || []}
                              onQuestionClick={handleQuestionNavigation}
                            />
                            ↪ 
                            <EditableText
                              fieldKey={`insight-${answer.id}`}
                              value={answer.linkedAnswerInsight.insightText}
                              editingFields={editingFields}
                              editedValues={editedValues}
                              onStartEdit={startEdit}
                              onUpdateValue={updateEditValue}
                              onCancelEdit={cancelEdit}
                              style={{ fontSize: 'inherit', fontStyle: 'inherit', color: 'inherit', marginLeft: '4px' }}
                            />
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                            {answer.linkedAnswerInsight.publishedTag && (
                              <PublishedTagChip publishedTag={answer.linkedAnswerInsight.publishedTag} />
                            )}
                            <div style={{ cursor: 'pointer' }}>
                              <EditableText
                                fieldKey={`short-${answer.id}`}
                                value={answer.linkedAnswerInsight.shortInsightText || ''}
                                editingFields={editingFields}
                                editedValues={editedValues}
                                onStartEdit={startEdit}
                                onUpdateValue={updateEditValue}
                                onCancelEdit={cancelEdit}
                                style={{ 
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: editingFields.has(`short-${answer.id}`) ? 'rgba(0, 123, 255, 0.1)' : '#e0e0e0',
                                  color: '#000',
                                  padding: '6px 12px',
                                  borderRadius: '12px',
                                  display: 'inline-block',
                                  maxWidth: '150px',
                                  wordWrap: 'break-word',
                                  lineHeight: '1.3',
                                  minHeight: '1.3em'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontStyle: 'italic', color: '#777', textAlign: 'left' }}>↪ No linked insight available for this option.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No related answer insights found for this question's options.</p>
          )}
          
          {/* Overlapping Questions Section */}
          {overlappingQuestions.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ margin: 0, marginBottom: '15px' }}>Overlapping Questions ({overlappingQuestions.length})</h4>
              {loadingOverlappingQuestions ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Loading overlapping questions...</p>
              ) : (
                <div>
                  {overlappingQuestions.map((question) => (
                    <div key={question.id} style={{ 
                      marginBottom: '15px',
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      {/* Question header */}
                      <div style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '15px', 
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '15px',
                        borderBottom: '1px solid #eee'
                      }}>
                        {/* Question type icon */}
                        <div style={{ 
                          flexShrink: 0,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          paddingTop: '2px'
                        }}>
                          {question.isImageQuestion ? '🖼️' : '💬'}
                        </div>
                        
                        {/* Main content area - clickable */}
                        <div 
                          style={{ 
                            flex: 1,
                            cursor: 'pointer',
                            minWidth: 0 // Allow text to wrap
                          }}
                          onClick={() => handleQuestionNavigation(question.id, question.category.id)}
                        >
                          <div style={{ 
                            fontSize: '14px', 
                            lineHeight: '1.4', 
                            color: '#333', 
                            fontWeight: 'normal', 
                            textAlign: 'left',
                            wordWrap: 'break-word'
                          }}>
                            <span style={{ fontWeight: 'bold' }}>{question.questionText}</span>
                            {question.answers && question.answers.map((answer: any, index: number) => (
                              <span key={answer.id || index}>
                                {' '}<span style={{ fontWeight: 'bold' }}>({index + 1})</span> {answer.answerText}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Right side chips and delete button */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-end', 
                            gap: '8px',
                            flexShrink: 0 // Prevent shrinking
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              {question.category.id !== questionData.category.id && (
                                <CategoryChip 
                                  insightSubject={question.category.insightSubject}
                                  categoryId={question.category.id}
                                  onClick={onCategoryClick}
                                />
                              )}
                              <QuestionIdChip 
                                persistentId={question.persistentId}
                                publishedId={question.publishedId}
                                isProposed={!!question.proposedQuestion}
                              />
                            </div>
                            {!hasChanges && (
                              <button
                                onClick={() => handleDeleteOverlappingQuestion(question.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '3px',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: '20px',
                                  height: '20px'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.backgroundColor = '#f8d7da';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '0.7';
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="Delete overlapping question"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Compatibility Section */}
          {questionData.compatibilityComparisons && questionData.compatibilityComparisons.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ margin: 0, marginBottom: '15px' }}>Compatibility</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {questionData.compatibilityComparisons.map((comparison) => (
                  <div key={comparison.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '15px',
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    {/* Left side - Stacked ShortInsightChips */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      flexShrink: 0,
                      minWidth: '120px'
                    }}>
                      <ShortInsightChip shortInsightText={comparison.insightA.shortInsightText} />
                      <ShortInsightChip shortInsightText={comparison.insightB.shortInsightText} />
                    </div>
                    
                    {/* Right side - Presentation content */}
                    <div style={{ flex: 1 }}>
                      {comparison.presentation ? (
                        <div>
                          <h5 style={{ 
                            margin: 0, 
                            marginBottom: '8px', 
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            {comparison.presentation.presentationTitle}
                          </h5>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <div style={{
                              backgroundColor: '#2c5282',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              maxWidth: '200px',
                              wordWrap: 'break-word',
                              lineHeight: '1.3'
                            }}>
                              {comparison.presentation.conciseAText}
                            </div>
                            <div style={{
                              backgroundColor: '#2c5282',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              maxWidth: '200px',
                              wordWrap: 'break-word',
                              lineHeight: '1.3'
                            }}>
                              {comparison.presentation.conciseBText}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h5 style={{ 
                            margin: 0, 
                            marginBottom: '8px', 
                            fontWeight: 'bold',
                            fontSize: '16px'
                          }}>
                            Compatible Insights
                          </h5>
                          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            These insights show positive compatibility but don't have detailed presentation data yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Comment Modal */}
      {showCommentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Comments ({comments.length})</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Add comment form */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCommentSubmit}
                  disabled={submittingComment || !newCommentText.trim()}
                  style={{
                    backgroundColor: submittingComment || !newCommentText.trim() ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: submittingComment || !newCommentText.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', margin: '20px 0' }}>
                  No comments yet. Be the first to add one!
                </p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: '4px'
                  }}>
                    {editingCommentId === comment.id ? (
                      /* Edit mode */
                      <div>
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={updatingComment || !editCommentText.trim()}
                            style={{
                              backgroundColor: updatingComment || !editCommentText.trim() ? '#ccc' : '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              cursor: updatingComment || !editCommentText.trim() ? 'not-allowed' : 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {updatingComment ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <p style={{ margin: 0, lineHeight: '1.4', fontSize: '14px', textAlign: 'left' }}>
                        <strong>{comment.username}:</strong> {comment.text}{' '}
                        <span style={{ 
                          color: '#999', 
                          fontSize: '12px', 
                          fontWeight: 'normal',
                          float: 'right',
                          marginTop: '0.3em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {user && user.username === comment.username && (
                            <>
                              <button
                                onClick={() => handleEditComment(comment)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#000',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  borderRadius: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  opacity: 0.7,
                                  transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                title="Edit comment"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  fontSize: '12px',
                                  cursor: deletingCommentId === comment.id ? 'not-allowed' : 'pointer',
                                  padding: '2px',
                                  borderRadius: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  opacity: deletingCommentId === comment.id ? 0.5 : 0.7,
                                  transition: 'opacity 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  if (deletingCommentId !== comment.id) {
                                    e.currentTarget.style.opacity = '1';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (deletingCommentId !== comment.id) {
                                    e.currentTarget.style.opacity = '0.7';
                                  }
                                }}
                                title="Delete comment"
                              >
                                {deletingCommentId === comment.id ? '⏳' : '✕'}
                              </button>
                            </>
                          )}
                          <span>{formatRelativeTime(comment.createdAt)}</span>
                        </span>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionView;