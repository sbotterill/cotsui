import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Collapse,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { API_BASE_URL } from '../config';

// Suggested questions for users to try
const SUGGESTED_QUESTIONS = [
  "What are the current z-scores for all commodities? Show me extreme readings.",
  "Which commodities have commercial z-scores above 2 or below -2?",
  "Based on commercial positioning and seasonality, what are the best commodities to watch?",
  "Show me commodities where commercials and retail have opposing z-scores",
  "What are the top commodities with bullish commercial z-scores and positive seasonality?",
];

// Single message component
const ChatMessage = ({ message, isUser, queries, data }) => {
  const theme = useTheme();
  const [showQueries, setShowQueries] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopySql = (sql, index) => {
    navigator.clipboard.writeText(sql);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Format message with markdown-like syntax
  const formatMessage = (text) => {
    if (!text) return '';
    
    // Split into lines and process
    return text.split('\n').map((line, i) => {
      // Bold text
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (processed.trim().startsWith('- ')) {
        processed = '• ' + processed.trim().substring(2);
      }
      return processed;
    }).join('\n');
  };

  const queryCount = queries?.length || 0;

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            maxWidth: '85%',
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isUser 
                ? theme.palette.primary.main 
                : alpha(theme.palette.success.main, 0.2),
              color: isUser 
                ? theme.palette.primary.contrastText 
                : theme.palette.success.main,
              flexShrink: 0,
            }}
          >
            {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
          </Box>

          {/* Message bubble */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: isUser 
                ? theme.palette.primary.main 
                : theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.8)
                  : theme.palette.grey[100],
              color: isUser 
                ? theme.palette.primary.contrastText 
                : theme.palette.text.primary,
              borderRadius: 2,
              borderTopLeftRadius: isUser ? 16 : 4,
              borderTopRightRadius: isUser ? 4 : 16,
            }}
          >
            <Typography 
              variant="body2" 
              component="div"
              sx={{ 
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                '& strong': { fontWeight: 600 },
              }}
              dangerouslySetInnerHTML={{ __html: formatMessage(message) }}
            />

            {/* SQL Queries toggle (only for AI responses with queries) */}
            {!isUser && queries && queries.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  icon={<CodeIcon fontSize="small" />}
                  label={showQueries ? `Hide ${queryCount} ${queryCount === 1 ? 'Query' : 'Queries'}` : `Show ${queryCount} ${queryCount === 1 ? 'Query' : 'Queries'}`}
                  size="small"
                  onClick={() => setShowQueries(!showQueries)}
                  deleteIcon={showQueries ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onDelete={() => setShowQueries(!showQueries)}
                  sx={{ 
                    cursor: 'pointer',
                    '& .MuiChip-deleteIcon': { ml: 0.5 }
                  }}
                />
                <Collapse in={showQueries}>
                  <Box sx={{ mt: 1 }}>
                    {queries.map((query, index) => (
                      <Box
                        key={index}
                        sx={{
                          mt: index > 0 ? 1 : 0,
                          p: 1.5,
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(0,0,0,0.3)' 
                            : 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          position: 'relative',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                            {query.purpose} ({query.rows_returned} rows)
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopySql(query.sql, index)}
                            sx={{ 
                              opacity: 0.7,
                              '&:hover': { opacity: 1 },
                              p: 0.5,
                            }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                        <Typography
                          component="pre"
                          sx={{
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            margin: 0,
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {query.sql}
                        </Typography>
                        {copiedIndex === index && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 36,
                              color: theme.palette.success.main 
                            }}
                          >
                            Copied!
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Fade>
  );
};

// Main AIChat component
const AIChat = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (questionOverride = null) => {
    const question = questionOverride || input.trim();
    if (!question || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: question,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const email = localStorage.getItem('userEmail') || '';
      
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          text: data.answer,
          isUser: false,
          queries: data.queries,  // Array of queries executed
          data: data.data,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          text: data.error || 'Sorry, I encountered an error processing your question. Please try again.',
          isUser: false,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I couldn\'t connect to the server. Please check your connection and try again.',
        isUser: false,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSend(question);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: 'calc(100vh - 120px)',
        p: { xs: 1, sm: 2 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          COTS AI
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Ask questions about CFTC Commitment of Traders data and Seasonality
        </Typography>
      </Box>

      {/* Messages area */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.default, 0.5)
            : theme.palette.grey[50],
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          mb: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 300,
              textAlign: 'center',
              gap: 3,
            }}
          >
            <SmartToyIcon sx={{ fontSize: 64, color: theme.palette.text.disabled }} />
            <Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Ask me anything about CFTC data and Seasonality
              </Typography>
              <Typography variant="body2" color="text.disabled">
                I can analyze positioning, find seasonal trends, compare trader groups, and more
              </Typography>
            </Box>
            
            {/* Suggested questions */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block' }}>
                Try asking:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', maxWidth: 600 }}>
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    onClick={() => handleSuggestedQuestion(question)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg.text}
                isUser={msg.isUser}
                queries={msg.queries}
                data={msg.data}
              />
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing your question...
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Paper>

      {/* Input area */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
        }}
      >
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask about CFTC data... (e.g., 'What commodities are commercials most bullish on?')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
            },
            width: 48,
            height: 48,
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Rate limit notice */}
      <Typography 
        variant="caption" 
        color="text.disabled" 
        sx={{ mt: 1, textAlign: 'center' }}
      >
        Powered by AI • 50 queries per hour
      </Typography>
    </Box>
  );
};

export default AIChat;
