import { Box, Container, Typography } from '@mui/material';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Insight Iris
          </Typography>
          <Routes>
            <Route path="/" element={<Typography>Home Page</Typography>} />
            {/* Add more routes here */}
          </Routes>
        </Box>
      </Container>
    </Box>
  );
}

export default App; 