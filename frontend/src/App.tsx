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
  onInsightTypeChange,
  onCategoryClick,
  onRefresh
}: { 
  onInsightClick: (questionId: number) => void;
  onInsightTypeChange: (type: InsightType) => void;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  onRefresh?: () => void;
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
      onCategoryClick={onCategoryClick}
      onRefresh={onRefresh}
    />
  );
};

// Component for Question view
const QuestionViewWrapper = ({ 
  onNavigateQuestion, 
  onSkipQuestion,
  currentQuestions,
  currentQuestionIndex,
  onCategoryClick
}: { 
  onNavigateQuestion: (direction: 'next' | 'prev') => void;
  onSkipQuestion: () => void;
  currentQuestions: { id: number; questionText: string }[];
  currentQuestionIndex: number;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
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

  // Generate functionality state (moved from InsightTable)
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string[]>([]);
  const [showGenerationStatus, setShowGenerationStatus] = useState<boolean>(false);
  const [statusLineTimestamps, setStatusLineTimestamps] = useState<Map<number, number>>(new Map());

  // Add Category modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [isAddingCategory, setIsAddingCategory] = useState<boolean>(false);
  const [newCategoryData, setNewCategoryData] = useState({
    category: '',
    subcategory: '',
    insightSubject: ''
  });

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
          const response = await fetch(`/api/questions/${selectedQuestionId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
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
          console.error('Failed to fetch question category context:', error);
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

  // Effect to handle log line fading animation
  useEffect(() => {
    if (!showGenerationStatus) return;
    
    const interval = setInterval(() => {
      // Force re-render to update opacity based on timestamps
      setStatusLineTimestamps(prev => new Map(prev));
    }, 100);
    
    return () => clearInterval(interval);
  }, [showGenerationStatus]);

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

  const handleRefreshInsights = async () => {
    if (!selectedCategoryId) return;
    
    try {
      // Refetch questions for the current category
      const response = await fetch(`/api/categories/${selectedCategoryId}/questions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const questions = await response.json();
      
      // Update the questions list for navigation
      const questionList: { id: number; questionText: string }[] = questions.map((question: any) => ({
        id: question.id,
        questionText: question.questionText,
      }));
      setCurrentQuestions(questionList);
      
      // Force re-render by changing the key or trigger a state update
      // The InsightTable component will refetch its data due to the categoryId dependency
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating || !selectedCategoryId) return;

    setIsGenerating(true);
    setGenerationStatus([]);
    setShowGenerationStatus(true);
    setStatusLineTimestamps(new Map());
    
    try {
      const response = await fetch(`/api/categories/${selectedCategoryId}/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
              setStatusLineTimestamps(prev => new Map(prev).set(prev.size, Date.now()));
              setTimeout(() => {
                handleRefreshInsights();
                setShowGenerationStatus(false);
                setIsGenerating(false);
              }, 2000);
              return;
            } else {
              setGenerationStatus(prev => {
                const newStatus = [...prev, line];
                setStatusLineTimestamps(prevTimestamps => {
                  const newTimestamps = new Map(prevTimestamps);
                  newTimestamps.set(newStatus.length - 1, Date.now());
                  return newTimestamps;
                });
                return newStatus;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationStatus(prev => [...prev, `Error: ${errorMessage}`]);
      setStatusLineTimestamps(prev => new Map(prev).set(prev.size, Date.now()));
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
      const response = await fetch('/api/categories', {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const createdCategory = await response.json();
      
      // Close modal and reset form
      setShowAddCategoryModal(false);
      setNewCategoryData({ category: '', subcategory: '', insightSubject: '' });
      
      // Refresh categories list
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const categories: Category[] = await categoriesResponse.json();
        setAllCategories(categories);
      }
      
      // Navigate to the new category
      handleCategoryClick(createdCategory.id, createdCategory.insightSubject);
      
    } catch (error) {
      console.error('Failed to add category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to add category: ${errorMessage}`);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setShowAddCategoryModal(false);
    setNewCategoryData({ category: '', subcategory: '', insightSubject: '' });
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

  const handleExport = () => {
    const link = document.createElement('a');
    link.href = '/api/export';
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="App">
      <header className="App-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Breadcrumbs 
          items={breadcrumbItems} 
          onCategoryNavigation={handleCategoryNavigation}
          canNavigatePrev={currentCategoryIndex > 0}
          canNavigateNext={currentCategoryIndex < allCategories.length - 1}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
              {isGenerating ? '⏳ Generating...' : '🔄 Generate Questions'}
            </button>
          )}
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
            ➕ Add Category
          </button>
          <SearchBox />
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<CategoriesView onCategoryClick={handleCategoryClick} />} />
          <Route path="/categories" element={<CategoriesView onCategoryClick={handleCategoryClick} />} />
          <Route path="/search" element={<SearchResultsView onQuestionClick={handleSearchQuestionClick} onCategoryClick={handleCategoryClick} />} />
          <Route 
            path="/categories/:categoryId" 
            element={
              <InsightsView 
                onInsightClick={handleQuestionClick}
                onInsightTypeChange={handleInsightTypeSelect}
                onCategoryClick={handleCategoryClick}
                onRefresh={handleRefreshInsights}
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
                onCategoryClick={handleCategoryClick}
              />
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
            maxWidth: '600px',
            maxHeight: '500px',
            margin: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              Generating Questions...
            </h3>
            
            {/* Log area with uniform background */}
            <div style={{ 
              overflow: 'auto', 
              fontFamily: 'monospace', 
              fontSize: '12px',
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              marginBottom: '16px',
            }}>
              {generationStatus.map((status, index) => {
                const timestamp = statusLineTimestamps.get(index) || Date.now();
                const isLatest = index === generationStatus.length - 1;
                const age = Date.now() - timestamp;
                const shouldFade = !isLatest && age > 1000;
                const shouldHide = !isLatest && age > 2000;
                
                if (shouldHide) return null;
                
                return (
                  <div 
                    key={index} 
                    style={{ 
                      marginBottom: '4px',
                      opacity: shouldFade ? 0.3 : 1,
                      transition: 'opacity 1s ease-out',
                      backgroundColor: 'transparent', // Uniform background
                    }}
                  >
                    {status}
                  </div>
                );
              })}
            </div>
            
            {/* Loading spinner */}
            {isGenerating && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
                <style>
                  {`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}
                </style>
              </div>
            )}
            
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
    </div>
  );
}

export default App; 