import React, { useState, useEffect } from 'react';
import Breadcrumbs from './components/Breadcrumbs';
import CategoryTable from './components/CategoryTable';
import InsightTable, { InsightType } from './components/InsightTable';
import QuestionView from './components/QuestionView';
import './App.css'; // For global styles if any

type View = 'categories' | 'insights' | 'question';

interface InsightPlaceholder {
    id: number;
    insightText: string;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [selectedInsightType, setSelectedInsightType] = useState<InsightType | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<number | null>(null);
  // const [selectedInsightTitle, setSelectedInsightTitle] = useState<string | null>(null); // To be used for breadcrumb

  // For Question View navigation
  const [currentQuestionableInsights, setCurrentQuestionableInsights] = useState<InsightPlaceholder[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // Fetch questionable insights when a category and insight type are selected, 
  // and we are about to go to the question view or are in it.
  useEffect(() => {
    if (selectedCategoryId && selectedInsightType) {
      const fetchInsightsForQuestionNavigation = async () => {
        try {
          //This is to populate the list of questions for next/prev navigation in QuestionView
          const apiPath = selectedInsightType === 'inspiration' ? 
          `/api/categories/${selectedCategoryId}/inspiration-insights` :
          `/api/categories/${selectedCategoryId}/answer-insights`;

          const response = await fetch(apiPath);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: InsightPlaceholder[] = await response.json();
          setCurrentQuestionableInsights(data);
        } catch (error) {
          console.error('Failed to fetch insights for question navigation:', error);
          setCurrentQuestionableInsights([]); // Reset on error
        }
      };
      fetchInsightsForQuestionNavigation();
    }
  }, [selectedCategoryId, selectedInsightType]);


  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    // Default to inspiration insights, or let user choose via UI elements not yet defined
    setSelectedInsightType('inspiration'); 
    setCurrentView('insights');
    setCurrentQuestionIndex(0); // Reset index when category changes
  };

  const handleInsightTypeSelect = (type: InsightType) => {
    setSelectedInsightType(type);
    setCurrentView('insights'); 
    setCurrentQuestionIndex(0); // Reset index when type changes
  };

  const handleInsightClick = (insightId: number, insightTitle: string) => {
    setSelectedInsightId(insightId);
    // setSelectedInsightTitle(insightTitle); // insightTitle is passed from InsightTable (which now uses insightText)
    
    const insightIndex = currentQuestionableInsights.findIndex(insight => insight.id === insightId);
    if (insightIndex !== -1) {
        setCurrentQuestionIndex(insightIndex);
    }
    setCurrentView('question');
  };

  const navigateToCategories = () => {
    setCurrentView('categories');
    setSelectedCategoryId(null);
    setSelectedCategoryName(null);
    setSelectedInsightType(null);
    setSelectedInsightId(null);
    setCurrentQuestionableInsights([]);
    setCurrentQuestionIndex(0);
  };

  const navigateToInsightsView = (type?: InsightType) => {
    if (!selectedCategoryId) return; // Should not happen if called from a state where category is selected
    setSelectedInsightType(type || selectedInsightType || 'inspiration');
    setCurrentView('insights');
    setSelectedInsightId(null);
    // currentQuestionIndex is preserved if just switching between inspiration/answers for same category
  };
  
  const handleQuestionNavigation = (direction: 'next' | 'prev') => {
    let newIndex = currentQuestionIndex;
    if (direction === 'next') {
      newIndex = Math.min(currentQuestionIndex + 1, currentQuestionableInsights.length - 1);
    } else {
      newIndex = Math.max(currentQuestionIndex - 1, 0);
    }
    if (newIndex !== currentQuestionIndex && currentQuestionableInsights[newIndex]) {
      setSelectedInsightId(currentQuestionableInsights[newIndex].id);
      // setSelectedInsightTitle(currentQuestionableInsights[newIndex].insightText); // Update title from insightText
      setCurrentQuestionIndex(newIndex);
      // The QuestionView component will re-fetch based on the new selectedInsightId
    }
  };

  const handleSkipQuestion = () => {
    // Navigate to the next question, or wrap around / go back to insights list
    if (currentQuestionIndex < currentQuestionableInsights.length - 1) {
        handleQuestionNavigation('next');
    } else {
        // Last question skipped, go back to insights view of the current category/type
        navigateToInsightsView(); 
    }
  };


  const breadcrumbItems = [
    { label: 'Categories', onClick: navigateToCategories, isCurrent: currentView === 'categories' },
  ];

  if (selectedCategoryId && selectedCategoryName) {
    breadcrumbItems.push({
      label: selectedCategoryName,
      onClick: () => navigateToInsightsView(), // Defaults to current or inspiration type
      isCurrent: currentView === 'insights' && !selectedInsightId
    });
     // Add button group for Inspiration/Answers if in insights view or deeper
  }

  // This is a conceptual placement for Inspiration/Answers type selection within the breadcrumb area or nearby
  // Actual UI for this selection needs to be designed. For now, it's handled by direct state changes.

  if (selectedInsightId && currentView === 'question') {
    const currentInsightTitle = currentQuestionableInsights[currentQuestionIndex]?.insightText || "Question";
    breadcrumbItems.push({
      label: currentInsightTitle, // Display the insightText of the current question
      onClick: () => { /* Clicking current question in breadcrumb might do nothing or reload */ },
      isCurrent: true
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <Breadcrumbs items={breadcrumbItems} />
        {currentView === 'insights' && selectedCategoryId && (
            <div style={{ marginTop: '10px', marginBottom: '10px'}}>
                <button onClick={() => handleInsightTypeSelect('inspiration')} disabled={selectedInsightType === 'inspiration'}>Inspiration Insights</button>
                <button onClick={() => handleInsightTypeSelect('answers')} disabled={selectedInsightType === 'answers'}>Answer Insights</button>
            </div>
        )}
      </header>
      <main>
        {currentView === 'categories' && <CategoryTable onCategoryClick={handleCategoryClick} />}
        {currentView === 'insights' && selectedCategoryId && selectedInsightType && (
          <InsightTable 
            categoryId={selectedCategoryId} 
            insightType={selectedInsightType} 
            onInsightClick={handleInsightClick} 
          />
        )}
        {currentView === 'question' && selectedInsightId && selectedCategoryId && (
          <QuestionView 
            insightId={selectedInsightId} 
            totalQuestionsInCategory={currentQuestionableInsights.length}
            currentQuestionIndex={currentQuestionIndex}
            onNavigateQuestion={handleQuestionNavigation}
            onSkipQuestion={handleSkipQuestion}
          />
        )}
      </main>
    </div>
  );
}

export default App; 