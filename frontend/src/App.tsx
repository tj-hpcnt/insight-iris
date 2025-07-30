import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Breadcrumbs, { BreadcrumbItem } from './components/Breadcrumbs';
import CategoryTable from './components/CategoryTable';
import InsightTable, { InsightType } from './components/InsightTable';
import QuestionView from './components/QuestionView';
import SearchBox from './components/SearchBox';
import SearchResultsView from './components/SearchResultsView';
import LoginPage from './components/LoginPage';
import AuthGuard from './components/AuthGuard';
import LogoutButton from './components/LogoutButton';
import CommentsTable from './components/CommentsTable';
import { apiFetch, downloadFile, ApiError } from './utils/apiUtils';
import './App.css'; // For global styles if any

interface User {
  username: string;
  role: string;
}

// Interface for categories
interface Category {
  id: number;
  category: string;
  subcategory: string;
  insightSubject: string;
}

// Component for Categories view
const CategoriesView = ({ 
  onCategoryClick,
  onApprovalChipClick,
  onRefresh,
  refreshTrigger
}: { 
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  onApprovalChipClick?: (categoryId: number, insightSubject: string) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}) => {
  return <CategoryTable onCategoryClick={onCategoryClick} onApprovalChipClick={onApprovalChipClick} onRefresh={onRefresh} refreshTrigger={refreshTrigger} />;
};

// Component for Insights view
const InsightsView = ({ 
  onInsightClick, 
  onInsightTypeChange,
  onCategoryClick,
  onRefresh,
  refreshTrigger
}: { 
  onInsightClick: (questionId: number) => void;
  onInsightTypeChange: (type: InsightType) => void;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const insightType = (searchParams.get('type') as InsightType) || 'answers';
  
  // Get approved filter from URL
  const approvedParam = searchParams.get('approved');
  let approved: boolean | undefined = undefined;
  if (approvedParam === 'true') {
    approved = true;
  } else if (approvedParam === 'false') {
    approved = false;
  }

  if (!categoryId) {
    return <p>Category not found</p>;
  }

  return (
    <InsightTable 
      categoryId={parseInt(categoryId)} 
      insightType={insightType} 
      approved={approved}
      onInsightClick={onInsightClick}
      onInsightTypeChange={onInsightTypeChange}
      onCategoryClick={onCategoryClick}
      onRefresh={onRefresh}
      refreshTrigger={refreshTrigger}
    />
  );
};

// Component for Question view
const QuestionViewWrapper = ({ 
  onNavigateQuestion, 
  onSkipQuestion,
  currentQuestions,
  currentQuestionIndex,
  onCategoryClick,
  user
}: { 
  onNavigateQuestion: (direction: 'next' | 'prev') => void;
  onSkipQuestion: () => void;
  currentQuestions: { id: number; questionText: string }[];
  currentQuestionIndex: number;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  user: { username: string; role: string } | null;
}) => {
  const { categoryId, questionId } = useParams<{ categoryId: string; questionId: string }>();

  if (!categoryId || !questionId) {
    return <p>Question not found</p>;
  }

  return (
    <QuestionView 
      questionId={parseInt(questionId)} 
      totalQuestionsInCategory={currentQuestions.length}
      currentQuestionIndex={currentQuestionIndex}
      onNavigateQuestion={onNavigateQuestion}
      onSkipQuestion={onSkipQuestion}
      onCategoryClick={onCategoryClick}
      user={user}
    />
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  
  // Parse URL to determine current view and parameters
  const getViewFromURL = () => {
    const path = location.pathname;
    if (path === '/' || path === '/categories') return 'categories';
    if (path === '/search') return 'search';
    if (path.includes('/categories/') && path.includes('/questions/')) return 'question';
    if (path.includes('/categories/')) return 'insights';
    return 'categories';
  };

  const getParamsFromURL = () => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    
    let categoryId: number | null = null;
    let questionId: number | null = null;
    let insightType: InsightType | null = null;
    let approved: boolean | null = null;
    
    // Extract categoryId from path like /categories/123 or /categories/123/questions/456
    const categoryMatch = path.match(/\/categories\/(\d+)/);
    if (categoryMatch) {
      categoryId = parseInt(categoryMatch[1]);
    }
    
    // Extract questionId from path like /categories/123/questions/456
    const questionMatch = path.match(/\/categories\/\d+\/questions\/(\d+)/);
    if (questionMatch) {
      questionId = parseInt(questionMatch[1]);
    }
    
    // Get insight type from search params
    const typeParam = searchParams.get('type');
    if (typeParam === 'inspiration' || typeParam === 'answers') {
      insightType = typeParam;
    }
    
    // Get approved filter from search params
    const approvedParam = searchParams.get('approved');
    if (approvedParam === 'true') {
      approved = true;
    } else if (approvedParam === 'false') {
      approved = false;
    }
    
    return { categoryId, questionId, insightType, approved };
  };

  const [currentView, setCurrentView] = useState<string>(getViewFromURL());
  const { categoryId: urlCategoryId, questionId: urlQuestionId, insightType: urlInsightType, approved: urlApproved } = getParamsFromURL();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(urlCategoryId);
  const [selectedInsightSubject, setSelectedInsightSubject] = useState<string | null>(null);
  const [selectedInsightType, setSelectedInsightType] = useState<InsightType | null>(urlInsightType || 'answers');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(urlQuestionId);
  const [selectedApproved, setSelectedApproved] = useState<boolean | null>(urlApproved);

  // For Question View navigation - now tracks questions instead of inspiration insights
  const [currentQuestions, setCurrentQuestions] = useState<{ id: number; questionText: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Category navigation state
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);

  // Generate functionality state (moved from InsightTable)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string[]>([]);
  const [showGenerationStatus, setShowGenerationStatus] = useState<boolean>(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Add Category modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryData, setNewCategoryData] = useState({
    category: '',
    subcategory: '',
    insightSubject: ''
  });

  // Propose Question modal state
  const [showProposeModal, setShowProposeModal] = useState<boolean>(false);
  const [isProposing, setIsProposing] = useState<boolean>(false);
  const [proposalStatus, setProposalStatus] = useState<string[]>([]);
  const [showProposalStatus, setShowProposalStatus] = useState<boolean>(false);
  const [currentProposalMessageIndex, setCurrentProposalMessageIndex] = useState<number>(0);
  const [isProposalTransitioning, setIsProposalTransitioning] = useState<boolean>(false);
  const [proposedQuestionText, setProposedQuestionText] = useState<string>('');

  // Refresh trigger for InsightTable
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Add refresh trigger for CategoryTable
  const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState<number>(0);

  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);

  // Regenerate Question modal state
  const [showRegenerateModal, setShowRegenerateModal] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenerationStatus, setRegenerationStatus] = useState<string[]>([]);
  const [showRegenerationStatus, setShowRegenerationStatus] = useState<boolean>(false);
  const [currentRegenerationMessageIndex, setCurrentRegenerationMessageIndex] = useState<number>(0);
  const [isRegenerationTransitioning, setIsRegenerationTransitioning] = useState<boolean>(false);
  const [regenerationFeedback, setRegenerationFeedback] = useState<string>('');
  const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<number | null>(null);

  // Add refresh function for categories
  const handleRefreshCategories = async () => {
    try {
      const response = await apiFetch('/api/categories');
      const categories: Category[] = await response.json();
      setAllCategories(categories);
      
      // Trigger CategoryTable refresh
      setCategoryRefreshTrigger(prev => prev + 1);
    } catch (error) {
      if (error instanceof ApiError) {
        alert(`Failed to refresh categories: ${error.message}`);
      } else {
        alert('Failed to refresh categories: An unexpected error occurred.');
      }
      console.error('Failed to refresh categories:', error);
    }
  };

  // Fetch all categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiFetch('/api/categories');
        const categories: Category[] = await response.json();
        setAllCategories(categories);
        
        // If a category is already selected, update the current index immediately
        if (selectedCategoryId && categories.length > 0) {
          const categoryIndex = categories.findIndex(cat => cat.id === selectedCategoryId);
          if (categoryIndex !== -1) {
            setCurrentCategoryIndex(categoryIndex);
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.status !== 401) {
          // Don't show alert for 401 errors as AuthGuard will handle redirect
          console.error('Failed to fetch categories:', error.message);
        } else {
          console.error('Failed to fetch categories:', error);
        }
        setAllCategories([]);
      }
    };
    fetchCategories();
  }, [selectedCategoryId]);

  // Update current category index when selected category changes
  useEffect(() => {
    if (selectedCategoryId && allCategories.length > 0) {
      const categoryIndex = allCategories.findIndex(cat => cat.id === selectedCategoryId);
      if (categoryIndex !== -1) {
        setCurrentCategoryIndex(categoryIndex);
      }
    }
  }, [selectedCategoryId, allCategories]);

  // Update state when URL changes (back/forward button)
  useEffect(() => {
    const newView = getViewFromURL();
    const { categoryId, questionId, insightType } = getParamsFromURL();
    
    setCurrentView(newView);
    setSelectedCategoryId(categoryId);
    setSelectedQuestionId(questionId);
    setSelectedInsightType(insightType || 'answers');
  }, [location]);

  // Fetch category details when selectedCategoryId changes (for page reload scenario)
  useEffect(() => {
    if (selectedCategoryId && allCategories.length > 0) {
      const category = allCategories.find(cat => cat.id === selectedCategoryId);
      if (category && category.insightSubject !== selectedInsightSubject) {
        setSelectedInsightSubject(category.insightSubject);
      }
    } else if (!selectedCategoryId) {
      setSelectedInsightSubject(null);
    }
  }, [selectedCategoryId, allCategories, selectedInsightSubject]);

  // Handle case where we're on a question page but don't have category context (direct URL access)
  useEffect(() => {
    if (currentView === 'question' && selectedQuestionId && !selectedInsightSubject) {
      const fetchQuestionCategory = async () => {
        try {
          const response = await apiFetch(`/api/questions/${selectedQuestionId}`);
          const questionData = await response.json();
          
          // Set the category context if it's missing
          if (questionData.category && questionData.category.insightSubject !== selectedInsightSubject) {
            setSelectedInsightSubject(questionData.category.insightSubject);
            
            // Also ensure categoryId is set correctly
            if (questionData.category.id !== selectedCategoryId) {
              setSelectedCategoryId(questionData.category.id);
            }
          }
        } catch (error) {
          if (error instanceof ApiError && error.status !== 401) {
            // Don't show alert for 401 errors as AuthGuard will handle redirect
            console.error('Failed to fetch question category context:', error.message);
          } else {
            console.error('Failed to fetch question category context:', error);
          }
        }
      };
      fetchQuestionCategory();
    }
  }, [currentView, selectedQuestionId, selectedInsightSubject, selectedCategoryId]);

  // When in question view, ensure the currentQuestionIndex matches the actual question
  useEffect(() => {
    if (currentView === 'question' && selectedQuestionId) {
      const questionIndex = currentQuestions.findIndex(
        question => question.id === selectedQuestionId
      );
      if (questionIndex !== -1 && questionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(questionIndex);
      }
    }
  }, [currentView, selectedQuestionId, currentQuestions, currentQuestionIndex]);

  // Fetch questions when a category is selected for question navigation
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchQuestionsForNavigation = async () => {
        try {
          const response = await apiFetch(`/api/categories/${selectedCategoryId}/questions`);
          const questions = await response.json();
          // Extract questions for navigation
          const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
            id: question.id,
            questionText: question.questionText,
          }));
          setCurrentQuestions(questionList);
        } catch (error) {
          if (error instanceof ApiError && error.status !== 401) {
            // Don't show alert for 401 errors as AuthGuard will handle redirect
            console.error('Failed to fetch questions for navigation:', error.message);
          } else {
            console.error('Failed to fetch questions for navigation:', error);
          }
          setCurrentQuestions([]); // Reset on error
        }
      };
      fetchQuestionsForNavigation();
    }
  }, [selectedCategoryId]); // Only depend on selectedCategoryId, not selectedInsightType

  // Effect to handle message queue and transitions
  useEffect(() => {
    if (!showGenerationStatus || generationStatus.length === 0) return;
    
    // If we're at the end of messages and generation is still ongoing, don't advance
    if (currentMessageIndex >= generationStatus.length - 1) return;
    
    const timer = setTimeout(() => {
      // Start transition
      setIsTransitioning(true);
      
      // After fade out duration, change message and fade in
      setTimeout(() => {
        setCurrentMessageIndex(prev => Math.min(prev + 1, generationStatus.length - 1));
        setIsTransitioning(false);
      }, 100); // 0.1 second transition
      
    }, 500); // 0.5 second minimum display time
    
    return () => clearTimeout(timer);
  }, [showGenerationStatus, generationStatus.length, currentMessageIndex]);

  // Effect to handle proposal message queue and transitions
  useEffect(() => {
    if (!showProposalStatus || proposalStatus.length === 0) return;
    
    // If we're at the end of messages and proposal is still ongoing, don't advance
    if (currentProposalMessageIndex >= proposalStatus.length - 1) return;
    
    const timer = setTimeout(() => {
      // Start transition
      setIsProposalTransitioning(true);
      
      // After fade out duration, change message and fade in
      setTimeout(() => {
        setCurrentProposalMessageIndex(prev => Math.min(prev + 1, proposalStatus.length - 1));
        setIsProposalTransitioning(false);
      }, 100); // 0.1 second transition
      
    }, 500); // 0.5 second minimum display time
    
    return () => clearTimeout(timer);
  }, [showProposalStatus, proposalStatus.length, currentProposalMessageIndex]);

  // Effect to handle regeneration message queue and transitions
  useEffect(() => {
    if (!showRegenerationStatus || regenerationStatus.length === 0) return;
    
    // If we're at the end of messages and regeneration is still ongoing, don't advance
    if (currentRegenerationMessageIndex >= regenerationStatus.length - 1) return;
    
    const timer = setTimeout(() => {
      // Start transition
      setIsRegenerationTransitioning(true);
      
      // After fade out duration, change message and fade in
      setTimeout(() => {
        setCurrentRegenerationMessageIndex(prev => Math.min(prev + 1, regenerationStatus.length - 1));
        setIsRegenerationTransitioning(false);
      }, 100); // 0.1 second transition
      
    }, 500); // 0.5 second minimum display time
    
    return () => clearTimeout(timer);
  }, [showRegenerationStatus, regenerationStatus.length, currentRegenerationMessageIndex]);

  const handleCategoryClick = async (categoryId: number, insightSubject: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedInsightSubject(insightSubject);
    setSelectedInsightType('answers'); 
    setSelectedApproved(null); // Clear approval filter for normal navigation
    setCurrentQuestionIndex(0); // Reset index when category changes
    
    // Navigate to insights view with URL
    navigate(`/categories/${categoryId}?type=answers`);
  };

  const handleApprovalChipClick = async (categoryId: number, insightSubject: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedInsightSubject(insightSubject);
    setSelectedInsightType('answers'); 
    setSelectedApproved(false); // Filter for unapproved questions
    setCurrentQuestionIndex(0); // Reset index when category changes
    
    // Navigate to insights view with URL and approved=false filter for unapproved questions
    navigate(`/categories/${categoryId}?type=answers&approved=false`);
  };

  const handleInsightTypeSelect = (type: InsightType) => {
    if (!selectedCategoryId) return;
    setSelectedInsightType(type);
    setCurrentQuestionIndex(0); // Reset index when type changes
    
    // Update URL with new insight type, preserving approved filter if present
    let url = `/categories/${selectedCategoryId}?type=${type}`;
    if (selectedApproved !== null) {
      url += `&approved=${selectedApproved}`;
    }
    navigate(url);
  };

  const handleQuestionClick = (questionId: number) => {
    if (!selectedCategoryId) return;
    setSelectedQuestionId(questionId);
    
    // Find the correct question index for navigation
    const questionIndex = currentQuestions.findIndex(question => question.id === questionId);
    if (questionIndex !== -1) {
        setCurrentQuestionIndex(questionIndex);
    } else {
        // If not found, reset to 0
        setCurrentQuestionIndex(0);
    }
    
    // Navigate to question view with URL
    navigate(`/categories/${selectedCategoryId}/questions/${questionId}`);
  };

  const handleSearchQuestionClick = async (questionId: number) => {
    try {
      // First, get the question to find its category
      const response = await apiFetch(`/api/questions/${questionId}`);
      const questionData = await response.json();
      
      // Set the category context
      const categoryId = questionData.category.id;
      setSelectedCategoryId(categoryId);
      setSelectedInsightSubject(questionData.category.insightSubject);
      setSelectedInsightType('answers');
      setSelectedQuestionId(questionId);
      
      // Update category index if needed
      if (allCategories.length > 0) {
        const categoryIndex = allCategories.findIndex(cat => cat.id === categoryId);
        if (categoryIndex !== -1) {
          setCurrentCategoryIndex(categoryIndex);
        }
      }
      
      // Refresh the questions list for this category to get correct index
      const questionsResponse = await apiFetch(`/api/categories/${categoryId}/questions`);
      const questions = await questionsResponse.json();
      const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
        id: question.id,
        questionText: question.questionText,
      }));
      setCurrentQuestions(questionList);
      
      // Find the index of the question
      const questionIndex = questionList.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        setCurrentQuestionIndex(questionIndex);
      }
      
      // Navigate to the question
      navigate(`/categories/${categoryId}/questions/${questionId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        alert(`Failed to navigate to question: ${error.message}`);
      } else {
        alert('Failed to navigate to question: An unexpected error occurred.');
      }
      console.error('Failed to navigate to search question:', error);
    }
  };

  const navigateToCategories = () => {
    setSelectedCategoryId(null);
    setSelectedInsightSubject(null);
    setSelectedInsightType(null);
    setSelectedApproved(null); // Clear approval filter
    setSelectedQuestionId(null);
    setCurrentQuestions([]);
    setCurrentQuestionIndex(0);
    
    // Navigate to categories view
    navigate('/categories');
  };

  const navigateToInsightsView = (type?: InsightType) => {
    if (!selectedCategoryId) return; // Should not happen if called from a state where category is selected
    const insightType = type || selectedInsightType || 'answers';
    setSelectedInsightType(insightType);
    setSelectedQuestionId(null);
    
    // Navigate to insights view with URL, preserving approved filter if present
    let url = `/categories/${selectedCategoryId}?type=${insightType}`;
    if (selectedApproved !== null) {
      url += `&approved=${selectedApproved}`;
    }
    navigate(url);
  };
  
  const handleQuestionNavigation = (direction: 'next' | 'prev') => {
    let newIndex = currentQuestionIndex;
    if (direction === 'next') {
      newIndex = Math.min(currentQuestionIndex + 1, currentQuestions.length - 1);
    } else {
      newIndex = Math.max(currentQuestionIndex - 1, 0);
    }
    if (newIndex !== currentQuestionIndex && currentQuestions[newIndex]) {
      const newQuestionId = currentQuestions[newIndex].id;
      setSelectedQuestionId(newQuestionId);
      setCurrentQuestionIndex(newIndex);
      
      // Update URL for navigation
      if (selectedCategoryId) {
        navigate(`/categories/${selectedCategoryId}/questions/${newQuestionId}`);
      }
    }
  };

  const handleSkipQuestion = () => {
    // Navigate to the next question, or wrap around / go back to insights list
    if (currentQuestionIndex < currentQuestions.length - 1) {
        handleQuestionNavigation('next');
    } else {
        // Last question skipped, go back to insights view of the current category/type
        navigateToInsightsView(); 
    }
  };

  const handleCategoryNavigation = (direction: 'prev' | 'next') => {
    if (!allCategories.length) return;
    
    let newIndex = currentCategoryIndex;
    if (direction === 'next') {
      newIndex = Math.min(currentCategoryIndex + 1, allCategories.length - 1);
    } else {
      newIndex = Math.max(currentCategoryIndex - 1, 0);
    }
    
    if (newIndex !== currentCategoryIndex && allCategories[newIndex]) {
      const newCategory = allCategories[newIndex];
      setSelectedCategoryId(newCategory.id);
      setSelectedInsightSubject(newCategory.insightSubject);
      setCurrentCategoryIndex(newIndex);
      setSelectedInsightType('answers');
      setCurrentQuestionIndex(0);
      
      // Navigate to the new category, preserving approval filter if present
      let url = `/categories/${newCategory.id}?type=answers`;
      if (selectedApproved !== null) {
        url += `&approved=${selectedApproved}`;
      }
      navigate(url);
    }
  };

  const handleRefreshInsights = async () => {
    if (!selectedCategoryId) return;
    
    try {
      // Refetch questions for the current category
      const response = await apiFetch(`/api/categories/${selectedCategoryId}/questions`);
      const questions = await response.json();
      
      // Update the questions list for navigation
      const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
        id: question.id,
        questionText: question.questionText,
      }));
      setCurrentQuestions(questionList);
      
      // Trigger InsightTable refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      if (error instanceof ApiError) {
        alert(`Failed to refresh insights: ${error.message}`);
      } else {
        alert('Failed to refresh insights: An unexpected error occurred.');
      }
      console.error('Failed to refresh insights:', error);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating || !selectedCategoryId) return;

    setIsGenerating(true);
    setGenerationStatus([]);
    setShowGenerationStatus(true);
    setCurrentMessageIndex(0);
    setIsTransitioning(false);
    
    try {
      const response = await apiFetch(`/api/categories/${selectedCategoryId}/generate`, {
        method: 'POST',
      });

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line === 'GENERATION_COMPLETE') {
              // Refresh the data when generation is complete
              setGenerationStatus(prev => [...prev, 'Generation completed! Refreshing data...']);
              setTimeout(() => {
                handleRefreshInsights();
                setShowGenerationStatus(false);
                setIsGenerating(false);
              }, 2000);
              return;
            } else {
              setGenerationStatus(prev => [...prev, line]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
      let errorMessage: string;
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error occurred';
      }
      setGenerationStatus(prev => [...prev, `Error: ${errorMessage}`]);
      setIsGenerating(false);
    }
  };

  const handleAddCategory = async () => {
    if (isAddingCategory) return;
    
    // Validate form data
    if (!newCategoryData.category.trim() || !newCategoryData.subcategory.trim() || !newCategoryData.insightSubject.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsAddingCategory(true);
    
    try {
      const response = await apiFetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: newCategoryData.category.trim(),
          subcategory: newCategoryData.subcategory.trim(),
          insightSubject: newCategoryData.insightSubject.trim(),
        }),
      });

      const createdCategory = await response.json();
      
      // Close modal and reset form
      setShowAddCategoryModal(false);
      setNewCategoryData({ category: '', subcategory: '', insightSubject: '' });
      
      // Refresh categories list
      await handleRefreshCategories();
      
      // Navigate to the new category
      handleCategoryClick(createdCategory.id, createdCategory.insightSubject);
      
    } catch (error) {
      console.error('Failed to add category:', error);
      let errorMessage: string;
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error occurred';
      }
      alert(`Failed to add category: ${errorMessage}`);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategoryModal(false);
    setNewCategoryData({ category: '', subcategory: '', insightSubject: '' });
  };

  const handleProposeQuestion = async () => {
    if (isProposing) return;
    
    // Validate form data
    if (!proposedQuestionText.trim()) {
      alert('Please enter a question idea');
      return;
    }

    setIsProposing(true);
    setProposalStatus([]);
    setShowProposalStatus(true);
    setCurrentProposalMessageIndex(0);
    setIsProposalTransitioning(false);
    setShowProposeModal(false);
    
    try {
      const response = await apiFetch('/api/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedQuestionText: proposedQuestionText.trim(),
        }),
      });

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('PROPOSAL_COMPLETE:')) {
              // Extract question ID and category ID from the response
              const parts = line.split(':');
              const questionId = parseInt(parts[1]);
              const categoryId = parseInt(parts[2]);
              
              setProposalStatus(prev => [...prev, 'Proposal completed! Navigating to new question...']);
              setTimeout(async () => {
                setShowProposalStatus(false);
                setIsProposing(false);
                setProposedQuestionText('');
                
                // Update the category context first
                setSelectedCategoryId(categoryId);
                
                // Refresh the questions list to include the new question
                try {
                  const response = await apiFetch(`/api/categories/${categoryId}/questions`);
                  const questions = await response.json();
                  const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
                    id: question.id,
                    questionText: question.questionText,
                  }));
                  setCurrentQuestions(questionList);
                  
                  // Find the index of the new question
                  const newQuestionIndex = questionList.findIndex(q => q.id === questionId);
                  if (newQuestionIndex !== -1) {
                    setCurrentQuestionIndex(newQuestionIndex);
                  }
                } catch (error) {
                  console.error('Failed to refresh questions after proposal:', error);
                }
                
                // Navigate to the new question
                navigate(`/categories/${categoryId}/questions/${questionId}`);
              }, 2000);
              return;
            } else if (line.startsWith('EXISTING_QUESTION:')) {
              // Extract existing question ID
              const questionId = parseInt(line.split(':')[1]);
              
              setProposalStatus(prev => [...prev, 'Question already exists! Navigating to existing question...']);
              setTimeout(async () => {
                setShowProposalStatus(false);
                setIsProposing(false);
                setProposedQuestionText('');
                
                // Get the question details to find its category
                try {
                  const questionResponse = await apiFetch(`/api/questions/${questionId}`);
                  const questionData = await questionResponse.json();
                  const categoryId = questionData.category.id;
                  
                  // Update the category context
                  setSelectedCategoryId(categoryId);
                  
                  // Refresh the questions list for this category
                  const response = await apiFetch(`/api/categories/${categoryId}/questions`);
                  const questions = await response.json();
                  const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
                    id: question.id,
                    questionText: question.questionText,
                  }));
                  setCurrentQuestions(questionList);
                  
                  // Find the index of the existing question
                  const existingQuestionIndex = questionList.findIndex(q => q.id === questionId);
                  if (existingQuestionIndex !== -1) {
                    setCurrentQuestionIndex(existingQuestionIndex);
                  }
                  
                  navigate(`/categories/${categoryId}/questions/${questionId}`);
                } catch (error) {
                  console.error('Failed to get question details:', error);
                  alert(`Question already exists with ID ${questionId}`);
                }
              }, 2000);
              return;
            } else {
              setProposalStatus(prev => [...prev, line]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Proposal failed:', error);
      let errorMessage: string;
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error occurred';
      }
      setProposalStatus(prev => [...prev, `Error: ${errorMessage}`]);
      setIsProposing(false);
    }
  };

  const handleCancelProposeQuestion = () => {
    setShowProposeModal(false);
    setProposedQuestionText('');
  };

  const handleRegenerateQuestion = (questionId: number, feedback: string) => {
    setRegeneratingQuestionId(questionId);
    setRegenerationFeedback(feedback);
    setShowRegenerateModal(true);
  };

  const handleExecuteRegeneration = async () => {
    if (isRegenerating || !regeneratingQuestionId) return;

    setIsRegenerating(true);
    setRegenerationStatus([]);
    setShowRegenerationStatus(true);
    setCurrentRegenerationMessageIndex(0);
    setIsRegenerationTransitioning(false);
    setShowRegenerateModal(false);
    
    try {
      const response = await apiFetch(`/api/questions/${regeneratingQuestionId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: regenerationFeedback,
        }),
      });

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('REGENERATION_COMPLETE:')) {
              // Extract question ID from the response
              const questionId = parseInt(line.split(':')[1]);
              
              setRegenerationStatus(prev => [...prev, 'Regeneration completed! Refreshing view...']);
              setTimeout(() => {
                setShowRegenerationStatus(false);
                setIsRegenerating(false);
                setRegenerationFeedback('');
                setRegeneratingQuestionId(null);
                
                // Refresh the page to show the updated question
                window.location.reload();
              }, 2000);
              return;
            } else {
              setRegenerationStatus(prev => [...prev, line]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
      let errorMessage: string;
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error occurred';
      }
      setRegenerationStatus(prev => [...prev, `Error: ${errorMessage}`]);
      setIsRegenerating(false);
    }
  };

  const handleCancelRegeneration = () => {
    setShowRegenerateModal(false);
    setRegenerationFeedback('');
    setRegeneratingQuestionId(null);
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Categories', onClick: navigateToCategories, isCurrent: currentView === 'categories' },
  ];

  if (currentView === 'search') {
    breadcrumbItems.push({
      label: 'Search Results',
      onClick: () => {}, // No action needed for current page
      isCurrent: true
    });
  } else if (selectedCategoryId && selectedInsightSubject) {
    breadcrumbItems.push({
      label: '',
      onClick: () => navigateToInsightsView(), // Defaults to current or inspiration type
      isCurrent: currentView === 'insights',
      insightSubject: selectedInsightSubject || undefined,
      approvalFilter: selectedApproved
    });
  }

  const handleExport = async () => {
    try {
      await downloadFile('/api/export', 'insights-export.json');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(`Export failed: ${error.message}`);
      } else {
        alert('Export failed: An unexpected error occurred. Please try again.');
      }
      console.error('Export failed:', error);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const exportButtonStyle = {
    background: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    color: 'white',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    marginLeft: '12px',
    marginRight: '12px',
  };

  const generateButtonStyle = {
    background: '#28a745',
    border: '1px solid #28a745',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: isGenerating ? 'not-allowed' : 'pointer',
    color: 'white',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    marginRight: '12px',
    opacity: isGenerating ? 0.6 : 1,
  };

  const addCategoryButtonStyle = {
    background: '#6f42c1',
    border: '1px solid #6f42c1',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: isAddingCategory ? 'not-allowed' : 'pointer',
    color: 'white',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    marginRight: '12px',
    opacity: isAddingCategory ? 0.6 : 1,
  };

  const proposeButtonStyle = {
    background: '#17a2b8',
    border: '1px solid #17a2b8',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: isProposing ? 'not-allowed' : 'pointer',
    color: 'white',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    marginRight: '12px',
    opacity: isProposing ? 0.6 : 1,
  };

  const commentsButtonStyle = {
    background: '#fd7e14',
    border: '1px solid #fd7e14',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    color: 'white',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '24px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    marginRight: '12px',
  };

  const showHeader = location.pathname !== '/login';

  return (
    <div className="App">
      {showHeader && (
        <header className="App-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Breadcrumbs 
          items={breadcrumbItems} 
          onCategoryNavigation={handleCategoryNavigation}
          canNavigatePrev={currentCategoryIndex > 0}
          canNavigateNext={currentCategoryIndex < allCategories.length - 1}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {currentView === 'categories' && (
            <button
              onClick={handleExport}
              style={exportButtonStyle}
              title="Export all data as JSON"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0056b3';
                e.currentTarget.style.borderColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
                e.currentTarget.style.borderColor = '#007bff';
              }}
            >
              📥 Export
            </button>
          )}
          {currentView === 'insights' && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              style={generateButtonStyle}
              title="Generate more questions for this category"
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = '#218838';
                  e.currentTarget.style.borderColor = '#1e7e34';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = '#28a745';
                  e.currentTarget.style.borderColor = '#28a745';
                }
              }}
            >
              {isGenerating ? '⏳ Generating...' : '🔄 Generate'}
            </button>
          )}
          {currentView === 'question' && selectedQuestionId && (
            <button
              onClick={() => handleRegenerateQuestion(selectedQuestionId, '')}
              disabled={isRegenerating}
              style={{
                background: '#17a2b8',
                border: '1px solid #17a2b8',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: isRegenerating ? 'not-allowed' : 'pointer',
                color: 'white',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '24px',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                marginRight: '12px',
                opacity: isRegenerating ? 0.6 : 1,
              }}
              title="Regenerate this question"
              onMouseEnter={(e) => {
                if (!isRegenerating) {
                  e.currentTarget.style.backgroundColor = '#138496';
                  e.currentTarget.style.borderColor = '#117a8b';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRegenerating) {
                  e.currentTarget.style.backgroundColor = '#17a2b8';
                  e.currentTarget.style.borderColor = '#17a2b8';
                }
              }}
            >
              {isRegenerating ? '⏳ Regenerating...' : '🔄 Regenerate'}
            </button>
          )}
          {currentView === 'categories' && (
            <button
              onClick={() => setShowCommentsModal(true)}
              style={commentsButtonStyle}
              title="View all comments"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8660c';
                e.currentTarget.style.borderColor = '#e8660c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fd7e14';
                e.currentTarget.style.borderColor = '#fd7e14';
              }}
            >
              💬 Comments
            </button>
          )}
          {currentView === 'categories' && (
            <button
              onClick={() => setShowAddCategoryModal(true)}
              style={addCategoryButtonStyle}
              title="Add a new category"
              disabled={isAddingCategory}
              onMouseEnter={(e) => {
                if (!isAddingCategory) {
                  e.currentTarget.style.backgroundColor = '#5a32a3';
                  e.currentTarget.style.borderColor = '#5a32a3';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAddingCategory) {
                  e.currentTarget.style.backgroundColor = '#6f42c1';
                  e.currentTarget.style.borderColor = '#6f42c1';
                }
              }}
            >
            + Category
          </button>
          )}
          {currentView === 'categories' && (
            <button
              onClick={() => setShowProposeModal(true)}
              style={proposeButtonStyle}
              title="Propose a new question"
              disabled={isProposing}
              onMouseEnter={(e) => {
                if (!isProposing) {
                  e.currentTarget.style.backgroundColor = '#138496';
                  e.currentTarget.style.borderColor = '#117a8b';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProposing) {
                  e.currentTarget.style.backgroundColor = '#17a2b8';
                  e.currentTarget.style.borderColor = '#17a2b8';
                }
              }}
            >
              💡 Propose
            </button>
          )}
          <SearchBox />
          {user && <LogoutButton user={user} onLogout={handleLogout} />}
        </div>
      </header>
      )}
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/" element={
            <AuthGuard user={user} onSetUser={setUser}>
              <CategoriesView onCategoryClick={handleCategoryClick} onApprovalChipClick={handleApprovalChipClick} onRefresh={handleRefreshCategories} refreshTrigger={categoryRefreshTrigger} />
            </AuthGuard>
          } />
          <Route path="/categories" element={
            <AuthGuard user={user} onSetUser={setUser}>
              <CategoriesView onCategoryClick={handleCategoryClick} onApprovalChipClick={handleApprovalChipClick} onRefresh={handleRefreshCategories} refreshTrigger={categoryRefreshTrigger} />
            </AuthGuard>
          } />
          <Route path="/search" element={
            <AuthGuard user={user} onSetUser={setUser}>
              <SearchResultsView onQuestionClick={handleSearchQuestionClick} onCategoryClick={handleCategoryClick} />
            </AuthGuard>
          } />
          <Route 
            path="/categories/:categoryId" 
            element={
              <AuthGuard user={user} onSetUser={setUser}>
                <InsightsView 
                  onInsightClick={handleQuestionClick}
                  onInsightTypeChange={handleInsightTypeSelect}
                  onCategoryClick={handleCategoryClick}
                  onRefresh={handleRefreshInsights}
                  refreshTrigger={refreshTrigger}
                />
              </AuthGuard>
            } 
          />
          <Route 
            path="/categories/:categoryId/questions/:questionId" 
            element={
              <AuthGuard user={user} onSetUser={setUser}>
                <QuestionViewWrapper 
                  onNavigateQuestion={handleQuestionNavigation}
                  onSkipQuestion={handleSkipQuestion}
                  currentQuestions={currentQuestions}
                  currentQuestionIndex={currentQuestionIndex}
                  onCategoryClick={handleCategoryClick}
                  user={user}
                />
              </AuthGuard>
            } 
          />
        </Routes>
      </main>

      {/* Generation Status Modal */}
      {showGenerationStatus && (
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
          zIndex: 1000,
        }}>
                          <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '35vw',
          height: '30vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            Generating Questions
            {isGenerating && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}></div>
            )}
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </h3>
          
          {/* Log area with current message display */}
          <div style={{ 
            flex: 1,
            fontFamily: 'monospace', 
            fontSize: '24px',
            backgroundColor: 'transparent',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {generationStatus.length > 0 && (
              <div 
                style={{ 
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                {generationStatus[currentMessageIndex] || 'Starting...'}
              </div>
            )}
          </div>
            
            {!isGenerating && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowGenerationStatus(false)}
                  style={{
                    background: '#007bff',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            margin: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              Add New Category
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Category:
              </label>
              <input
                type="text"
                value={newCategoryData.category}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Personal Development"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                disabled={isAddingCategory}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Subcategory:
              </label>
              <input
                type="text"
                value={newCategoryData.subcategory}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, subcategory: e.target.value }))}
                placeholder="e.g., Goal Setting"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                disabled={isAddingCategory}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                Insight Subject:
              </label>
              <input
                type="text"
                value={newCategoryData.insightSubject}
                onChange={(e) => setNewCategoryData(prev => ({ ...prev, insightSubject: e.target.value }))}
                placeholder="e.g., Personal goal-setting strategies"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                disabled={isAddingCategory}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancelAddCategory}
                disabled={isAddingCategory}
                style={{
                  background: '#6c757d',
                  border: '1px solid #6c757d',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: isAddingCategory ? 'not-allowed' : 'pointer',
                  opacity: isAddingCategory ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={isAddingCategory}
                style={{
                  background: '#6f42c1',
                  border: '1px solid #6f42c1',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: isAddingCategory ? 'not-allowed' : 'pointer',
                  opacity: isAddingCategory ? 0.6 : 1,
                }}
              >
                {isAddingCategory ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Question Modal */}
      {showProposeModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '35%',
            margin: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              Propose a Question
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Question Idea:
              </label>
              <input
                type="text"
                value={proposedQuestionText}
                onChange={(e) => setProposedQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isProposing && proposedQuestionText.trim()) {
                    handleProposeQuestion();
                  }
                }}
                placeholder="Enter your question idea here..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                disabled={isProposing}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancelProposeQuestion}
                disabled={isProposing}
                style={{
                  background: '#6c757d',
                  border: '1px solid #6c757d',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: isProposing ? 'not-allowed' : 'pointer',
                  opacity: isProposing ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleProposeQuestion}
                disabled={isProposing}
                style={{
                  background: '#17a2b8',
                  border: '1px solid #17a2b8',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: isProposing ? 'not-allowed' : 'pointer',
                  opacity: isProposing ? 0.6 : 1,
                }}
              >
                {isProposing ? 'Proposing...' : 'Propose Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Status Modal */}
      {showProposalStatus && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '35vw',
            height: '30vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              Processing Question Proposal
              {isProposing && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #17a2b8',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
              )}
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </h3>
            
            {/* Log area with current message display */}
            <div style={{ 
              flex: 1,
              fontFamily: 'monospace', 
              fontSize: '24px',
              backgroundColor: 'transparent',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {proposalStatus.length > 0 && (
                <div 
                  style={{ 
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  {proposalStatus[currentProposalMessageIndex] || 'Starting...'}
                </div>
              )}
            </div>
              
            {!isProposing && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowProposalStatus(false)}
                  style={{
                    background: '#17a2b8',
                    border: '1px solid #17a2b8',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regenerate Question Modal */}
      {showRegenerateModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '35%',
            margin: '20px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              Regenerate Question
            </h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Feedback (optional):
              </label>
              <textarea
                value={regenerationFeedback}
                onChange={(e) => setRegenerationFeedback(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && !isRegenerating) {
                    handleExecuteRegeneration();
                  }
                }}
                placeholder="Enter feedback to improve the question (leave empty for a random variation)..."
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
                disabled={isRegenerating}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={handleCancelRegeneration}
                disabled={isRegenerating}
                style={{
                  background: '#6c757d',
                  border: '1px solid #6c757d',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: isRegenerating ? 'not-allowed' : 'pointer',
                  opacity: isRegenerating ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRegeneration}
                disabled={isRegenerating}
                style={{
                  background: '#17a2b8',
                  border: '1px solid #17a2b8',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  color: 'white',
                  cursor: isRegenerating ? 'not-allowed' : 'pointer',
                  opacity: isRegenerating ? 0.6 : 1,
                }}
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regeneration Status Modal */}
      {showRegenerationStatus && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '35vw',
            height: '30vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              Regenerating Question
              {isRegenerating && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #17a2b8',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
              )}
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </h3>
            
            {/* Log area with current message display */}
            <div style={{ 
              flex: 1,
              fontFamily: 'monospace', 
              fontSize: '24px',
              backgroundColor: 'transparent',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {regenerationStatus.length > 0 && (
                <div 
                  style={{ 
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  {regenerationStatus[currentRegenerationMessageIndex] || 'Starting...'}
                </div>
              )}
            </div>
              
            {!isRegenerating && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowRegenerationStatus(false)}
                  style={{
                    background: '#17a2b8',
                    border: '1px solid #17a2b8',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '90vw',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <CommentsTable onClose={() => setShowCommentsModal(false)} onCategoryClick={handleCategoryClick} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 