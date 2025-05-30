import React, { useState, useEffect } from 'react';
import Breadcrumbs, { BreadcrumbItem } from './components/Breadcrumbs';
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
  const [selectedInsightSubject, setSelectedInsightSubject] = useState<string | null>(null);
  const [selectedInsightType, setSelectedInsightType] = useState<InsightType | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<number | null>(null);
  // const [selectedInsightTitle, setSelectedInsightTitle] = useState<string | null>(null); // To be used for breadcrumb
  const [currentQuestionText, setCurrentQuestionText] = useState<string | null>(null);

  // For Question View navigation - should only track inspiration insights
  const [currentQuestionableInsights, setCurrentQuestionableInsights] = useState<InsightPlaceholder[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

  // When in question view, ensure the currentQuestionIndex matches the actual inspiration insight
  useEffect(() => {
    if (currentView === 'question' && selectedInsightId) {
      // Fetch the question context to get the inspiration insight ID
      const updateQuestionIndex = async () => {
        try {
          const response = await fetch(`/api/insights/${selectedInsightId}/question-details`);
          if (response.ok) {
            const data = await response.json();
            
            // Store the question text for breadcrumb
            if (data.questionText) {
              setCurrentQuestionText(data.questionText);
            }
            
            if (data.inspirationInsightDetails) {
              const inspirationIndex = currentQuestionableInsights.findIndex(
                insight => insight.id === data.inspirationInsightDetails.id
              );
              if (inspirationIndex !== -1 && inspirationIndex !== currentQuestionIndex) {
                setCurrentQuestionIndex(inspirationIndex);
              }
            }
          }
        } catch (error) {
          console.error('Failed to update question index:', error);
        }
      };
      updateQuestionIndex();
    } else {
      // Clear question text when not in question view
      setCurrentQuestionText(null);
    }
  }, [currentView, selectedInsightId, currentQuestionableInsights, currentQuestionIndex]);

  // Fetch inspiration insights when a category is selected for question navigation
  // This should only fetch inspiration insights since questions are based on inspiration insights
  useEffect(() => {
    if (selectedCategoryId) {
      const fetchInspirationInsightsForQuestionNavigation = async () => {
        try {
          // Always fetch inspiration insights for question navigation, regardless of current view type
          const response = await fetch(`/api/categories/${selectedCategoryId}/inspiration-insights`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: InsightPlaceholder[] = await response.json();
          setCurrentQuestionableInsights(data);
        } catch (error) {
          console.error('Failed to fetch inspiration insights for question navigation:', error);
          setCurrentQuestionableInsights([]); // Reset on error
        }
      };
      fetchInspirationInsightsForQuestionNavigation();
    }
  }, [selectedCategoryId]); // Only depend on selectedCategoryId, not selectedInsightType

  const handleCategoryClick = async (categoryId: number, insightSubject: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedInsightSubject(insightSubject);
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

  const handleInsightClick = (insightId: number) => {
    setSelectedInsightId(insightId);
    // setSelectedInsightTitle(insightTitle); // insightTitle is passed from InsightTable (which now uses insightText)
    
    // For question navigation, we need to find the correct inspiration insight index
    // If clicking on an inspiration insight, find its index directly
    // If clicking on an answer insight, we need to find the corresponding inspiration insight
    const insightIndex = currentQuestionableInsights.findIndex(insight => insight.id === insightId);
    if (insightIndex !== -1) {
        // This is an inspiration insight, use its index directly
        setCurrentQuestionIndex(insightIndex);
    } else {
        // This might be an answer insight, we'll let the QuestionView component handle finding the right inspiration
        // For now, keep the current index or reset to 0 if no current index
        if (currentQuestionIndex >= currentQuestionableInsights.length) {
            setCurrentQuestionIndex(0);
        }
        // The QuestionView will fetch the full context and determine the correct inspiration insight
    }
    setCurrentView('question');
  };

  const navigateToCategories = () => {
    setCurrentView('categories');
    setSelectedCategoryId(null);
    setSelectedInsightSubject(null);
    setSelectedInsightType(null);
    setSelectedInsightId(null);
    setCurrentQuestionableInsights([]);
    setCurrentQuestionIndex(0);
    setCurrentQuestionText(null);
  };

  const navigateToInsightsView = (type?: InsightType) => {
    if (!selectedCategoryId) return; // Should not happen if called from a state where category is selected
    setSelectedInsightType(type || selectedInsightType || 'inspiration');
    setCurrentView('insights');
    setSelectedInsightId(null);
    setCurrentQuestionText(null);
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
      // Always navigate to the inspiration insight ID since questions are based on inspiration insights
      setSelectedInsightId(currentQuestionableInsights[newIndex].id);
      setCurrentQuestionIndex(newIndex);
      // The QuestionView component will re-fetch based on the new selectedInsightId (inspiration insight)
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


  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Categories', onClick: navigateToCategories, isCurrent: currentView === 'categories' },
  ];

  if (selectedCategoryId && selectedInsightSubject) {
    breadcrumbItems.push({
      label: '',
      onClick: () => navigateToInsightsView(), // Defaults to current or inspiration type
      isCurrent: currentView === 'insights' && !selectedInsightId,
      insightSubject: selectedInsightSubject || undefined
    });
     // Add button group for Inspiration/Answers if in insights view or deeper
  }

  // This is a conceptual placement for Inspiration/Answers type selection within the breadcrumb area or nearby
  // Actual UI for this selection needs to be designed. For now, it's handled by direct state changes.

  if (selectedInsightId && currentView === 'question') {
    const currentTitle = currentQuestionableInsights[currentQuestionIndex]?.insightText || "Question";
    breadcrumbItems.push({
      label: currentTitle ||  "Question", // Use question text if available, fallback to insight text
      onClick: () => { /* Clicking current question in breadcrumb might do nothing or reload */ },
      isCurrent: true
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <Breadcrumbs items={breadcrumbItems} />
      </header>
      <main>
        {currentView === 'categories' && <CategoryTable onCategoryClick={handleCategoryClick} />}
        {currentView === 'insights' && selectedCategoryId && selectedInsightType && (
          <InsightTable 
            categoryId={selectedCategoryId} 
            insightType={selectedInsightType} 
            onInsightClick={handleInsightClick}
            onInsightTypeChange={handleInsightTypeSelect}
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