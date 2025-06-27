import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Breadcrumbs, { BreadcrumbItem } from './components/Breadcrumbs';
import CategoryTable from './components/CategoryTable';
import InsightTable, { InsightType } from './components/InsightTable';
import QuestionView from './components/QuestionView';
import SearchBox from './components/SearchBox';
import SearchResultsView from './components/SearchResultsView';
import './App.css'; // For global styles if any

// Interface for categories
interface Category {
  id: number;
  category: string;
  subcategory: string;
  insightSubject: string;
}

// Component for Categories view
const CategoriesView = ({ onCategoryClick }: { onCategoryClick: (categoryId: number, insightSubject: string) => void }) => {
  return <CategoryTable onCategoryClick={onCategoryClick} />;
};

// Component for Insights view
const InsightsView = ({ 
  onInsightClick, 
  onInsightTypeChange 
}: { 
  onInsightClick: (questionId: number) => void;
  onInsightTypeChange: (type: InsightType) => void;
}) => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const insightType = (searchParams.get('type') as InsightType) || 'answers';

  if (!categoryId) {
    return <p>Category not found</p>;
  }

  return (
    <InsightTable 
      categoryId={parseInt(categoryId)} 
      insightType={insightType} 
      onInsightClick={onInsightClick}
      onInsightTypeChange={onInsightTypeChange}
    />
  );
};

// Component for Question view
const QuestionViewWrapper = ({ 
  onNavigateQuestion, 
  onSkipQuestion,
  currentQuestions,
  currentQuestionIndex
}: { 
  onNavigateQuestion: (direction: 'next' | 'prev') => void;
  onSkipQuestion: () => void;
  currentQuestions: { id: number; questionText: string }[];
  currentQuestionIndex: number;
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
    />
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
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
    
    return { categoryId, questionId, insightType };
  };

  const [currentView, setCurrentView] = useState<string>(getViewFromURL());
  const { categoryId: urlCategoryId, questionId: urlQuestionId, insightType: urlInsightType } = getParamsFromURL();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(urlCategoryId);
  const [selectedInsightSubject, setSelectedInsightSubject] = useState<string | null>(null);
  const [selectedInsightType, setSelectedInsightType] = useState<InsightType | null>(urlInsightType || 'answers');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(urlQuestionId);

  // For Question View navigation - now tracks questions instead of inspiration insights
  const [currentQuestions, setCurrentQuestions] = useState<{ id: number; questionText: string }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Category navigation state
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState<number>(0);

  // Fetch all categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories: Category[] = await response.json();
        setAllCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setAllCategories([]);
      }
    };
    fetchCategories();
  }, []);

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
          const response = await fetch(`/api/categories/${selectedCategoryId}/questions`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const questions = await response.json();
          // Extract questions for navigation
          const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
            id: question.id,
            questionText: question.questionText,
          }));
          setCurrentQuestions(questionList);
        } catch (error) {
          console.error('Failed to fetch questions for navigation:', error);
          setCurrentQuestions([]); // Reset on error
        }
      };
      fetchQuestionsForNavigation();
    }
  }, [selectedCategoryId]); // Only depend on selectedCategoryId, not selectedInsightType

  const handleCategoryClick = async (categoryId: number, insightSubject: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedInsightSubject(insightSubject);
    setSelectedInsightType('answers'); 
    setCurrentQuestionIndex(0); // Reset index when category changes
    
    // Navigate to insights view with URL
    navigate(`/categories/${categoryId}?type=answers`);
  };

  const handleInsightTypeSelect = (type: InsightType) => {
    if (!selectedCategoryId) return;
    setSelectedInsightType(type);
    setCurrentQuestionIndex(0); // Reset index when type changes
    
    // Update URL with new insight type
    navigate(`/categories/${selectedCategoryId}?type=${type}`);
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
      const response = await fetch(`/api/questions/${questionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
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
      
      // Navigate to the question
      navigate(`/categories/${categoryId}/questions/${questionId}`);
    } catch (error) {
      console.error('Failed to navigate to search question:', error);
    }
  };

  const navigateToCategories = () => {
    setSelectedCategoryId(null);
    setSelectedInsightSubject(null);
    setSelectedInsightType(null);
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
    
    // Navigate to insights view with URL
    navigate(`/categories/${selectedCategoryId}?type=${insightType}`);
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
      
      // Navigate to the new category
      navigate(`/categories/${newCategory.id}?type=answers`);
    }
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
      isCurrent: currentView === 'insights' && !selectedQuestionId,
      insightSubject: selectedInsightSubject || undefined
    });
     // Add button group for Inspiration/Answers if in insights view or deeper
  }

  // This is a conceptual placement for Inspiration/Answers type selection within the breadcrumb area or nearby
  // Actual UI for this selection needs to be designed. For now, it's handled by direct state changes.

  if (selectedQuestionId && currentView === 'question') {
    const currentTitle = currentQuestions[currentQuestionIndex]?.questionText || "Question";
    breadcrumbItems.push({
      label: currentTitle ||  "Question", // Use question text if available, fallback to insight text
      onClick: () => { /* Clicking current question in breadcrumb might do nothing or reload */ },
      isCurrent: true
    });
  }

  return (
    <div className="App">
      <header className="App-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        <Breadcrumbs 
          items={breadcrumbItems} 
          onCategoryNavigation={handleCategoryNavigation}
          canNavigatePrev={currentCategoryIndex > 0}
          canNavigateNext={currentCategoryIndex < allCategories.length - 1}
        />
        <SearchBox />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<CategoriesView onCategoryClick={handleCategoryClick} />} />
          <Route path="/categories" element={<CategoriesView onCategoryClick={handleCategoryClick} />} />
          <Route path="/search" element={<SearchResultsView onQuestionClick={handleSearchQuestionClick} />} />
          <Route 
            path="/categories/:categoryId" 
            element={
              <InsightsView 
                onInsightClick={handleQuestionClick}
                onInsightTypeChange={handleInsightTypeSelect}
              />
            } 
          />
          <Route 
            path="/categories/:categoryId/questions/:questionId" 
            element={
              <QuestionViewWrapper 
                onNavigateQuestion={handleQuestionNavigation}
                onSkipQuestion={handleSkipQuestion}
                currentQuestions={currentQuestions}
                currentQuestionIndex={currentQuestionIndex}
              />
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App; 