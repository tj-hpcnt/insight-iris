import React, { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../utils/apiUtils';
import CategoryChip from './CategoryChip';

interface Comment {
  id: number;
  questionId: number;
  text: string;
  username: string;
  createdAt: string;
  question: {
    id: number;
    questionText: string;
    answers: {
      id: number;
      answerText: string;
    }[];
    category: {
      id: number;
      category: string;
      subcategory: string;
      insightSubject: string;
    };
  };
}

interface CommentGroup {
  questionId: number;
  questionText: string;
  answers: { id: number; answerText: string }[];
  category: { id: number; category: string; subcategory: string; insightSubject: string };
  comments: Comment[];
}

interface CommentsTableProps {
  onClose?: () => void;
  onCategoryClick?: (categoryId: number, insightSubject: string) => void;
}

const CommentsTable: React.FC<CommentsTableProps> = ({ onClose, onCategoryClick }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/comments');
        const commentsData = await response.json();
        setComments(commentsData);
      } catch (error) {
        if (error instanceof ApiError) {
          setError(`Failed to load comments: ${error.message}`);
        } else {
          setError('Failed to load comments: An unexpected error occurred.');
        }
        console.error('Failed to fetch comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  // Group comments by question, maintaining chronological order
  const groupedComments = React.useMemo(() => {
    const groups: CommentGroup[] = [];
    const processedQuestions = new Set<number>();

    for (const comment of comments) {
      if (!processedQuestions.has(comment.questionId)) {
        // Find all comments for this question
        const questionComments = comments.filter(c => c.questionId === comment.questionId);
        
        groups.push({
          questionId: comment.questionId,
          questionText: comment.question.questionText,
          answers: comment.question.answers,
          category: comment.question.category,
          comments: questionComments,
        });

        processedQuestions.add(comment.questionId);
      }
    }

    return groups;
  }, [comments]);

  // Add helper function for relative time formatting (same as QuestionView)
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

  const formatQuestionAndAnswers = (questionText: string, answers: { answerText: string }[]) => {
    return (
      <>
        <span style={{ fontWeight: 'bold' }}>{questionText}</span>
        {answers.map((answer, index) => (
          <span key={index}>
            {' '}<span style={{ fontWeight: 'bold' }}>({index + 1})</span> {answer.answerText}
          </span>
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading comments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>{error}</div>
        {onClose && (
          <button onClick={onClose} style={{ marginTop: '10px' }}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxHeight: '80vh', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>All Comments ({comments.length})</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: '#dc3545',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        )}
      </div>

      {groupedComments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No comments found.
        </div>
      ) : (
        <div>
          {groupedComments.map((group) => (
            <div key={group.questionId} style={{ marginBottom: '30px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Question header */}
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderBottom: '1px solid #ddd', position: 'relative' }}>
                <div style={{ paddingRight: '120px' }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#666', fontWeight: 'normal', textAlign: 'left' }}>
                    {formatQuestionAndAnswers(group.questionText, group.answers)}
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                  <CategoryChip 
                    insightSubject={group.category.insightSubject}
                    categoryId={group.category.id}
                    onClick={onCategoryClick}
                  />
                </div>
              </div>

              {/* Comments - IRC style */}
              <div style={{ padding: '0' }}>
                {group.comments.map((comment, index) => (
                  <div 
                    key={comment.id} 
                    style={{ 
                      padding: '8px 15px', 
                      borderBottom: index < group.comments.length - 1 ? '1px solid #eee' : 'none',
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}
                  >
                    <div style={{ lineHeight: '1.4', fontSize: '14px', textAlign: 'left' }}>
                      <strong style={{ color: '#007bff' }}>{comment.username}:</strong> {comment.text}{' '}
                      <span style={{ 
                        color: '#999', 
                        fontSize: '12px', 
                        fontWeight: 'normal',
                        float: 'right',
                        marginTop: '0.1em'
                      }}>
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsTable;