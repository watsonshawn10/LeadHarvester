import WebSocket from 'ws';

// Test WebSocket connection to the chat system
const wsUrl = 'ws://localhost:5000/ws';
const socket = new WebSocket(wsUrl);

socket.on('open', function open() {
  console.log('✓ WebSocket connection established');
  
  // Test message format
  const testMessage = {
    type: 'join',
    projectId: 1,
    userId: 5
  };
  
  socket.send(JSON.stringify(testMessage));
  console.log('✓ Sent join message:', testMessage);
  
  // Test sending a chat message
  setTimeout(() => {
    const chatMessage = {
      type: 'message',
      projectId: 1,
      receiverId: 1,
      content: 'Hello! This is a test message from the chat system.',
      messageType: 'text'
    };
    
    socket.send(JSON.stringify(chatMessage));
    console.log('✓ Sent chat message:', chatMessage);
  }, 1000);
});

socket.on('message', function message(data) {
  try {
    const parsedData = JSON.parse(data);
    console.log('✓ Received message:', parsedData);
  } catch (e) {
    console.log('✓ Received raw data:', data.toString());
  }
});

socket.on('error', function error(err) {
  console.log('✗ WebSocket error:', err.message);
});

socket.on('close', function close() {
  console.log('✓ WebSocket connection closed');
});

// Close after 5 seconds
setTimeout(() => {
  socket.close();
}, 5000);