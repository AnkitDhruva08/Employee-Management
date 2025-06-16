import React, { useState, useEffect, useRef } from 'react';
import {
    fetchDashboardLink,
    fetchDashboard,
    fetchEmployees,
    fecthTasks, 
    loadTaskTags,
    generateTaskCards,
  } from "../utils/api";

// --- Utility: Dummy Data Generation ---
const generateDummyData = () => {
  const users = [
    { id: 'bhavesh', name: 'Bhavesh Akhade', avatar: 'https://placehold.co/40x40/6366F1/FFFFFF?text=BA', status: 'Available' },
    { id: 'nikhil', name: 'Nikhil Soni', avatar: 'https://placehold.co/40x40/EF4444/FFFFFF?text=NS', status: 'Available' },
    { id: 'ayushb', name: 'Ayush Bhavesh', avatar: 'https://placehold.co/40x40/3B82F6/FFFFFF?text=AB', status: 'Busy' },
    { id: 'ayushm', name: 'Ayush Michael', avatar: 'https://placehold.co/40x40/10B981/FFFFFF?text=AM', status: 'Away' },
    { id: 'prateek', name: 'Prateek Audichya', avatar: 'https://placehold.co/40x40/F59E0B/FFFFFF?text=PA', status: 'Available' },
    { id: 'ankit', name: 'Ankit Mishra (You)', avatar: 'https://placehold.co/40x40/8B5CF6/FFFFFF?text=AM', status: 'Online' }, // This is "You"
    { id: 'anuj', name: 'Anuj Srivastava', avatar: 'https://placehold.co/40x40/EC4899/FFFFFF?text=AS', status: 'Busy' },
    { id: 'aroshf', name: 'Arosh Flowid', avatar: 'https://placehold.co/40x40/06B6D4/FFFFFF?text=AF', status: 'Away' },
    { id: 'aroshg', name: 'Arosh Grovs', avatar: 'https://placehold.co/40x40/6B7280/FFFFFF?text=AG', status: 'Offline' },
    { id: 'anurag', name: 'Anurag Srivastava', avatar: 'https://placehold.co/40x40/EAB308/FFFFFF?text=AS', status: 'Available' },
  ];

  const currentUser = users.find(u => u.id === 'ankit'); // Define 'You'

  const generateMessages = (sender, receiver, count, isGroup = false) => {
    const msgs = [];
    const baseTime = new Date();
    for (let i = 0; i < count; i++) {
      baseTime.setMinutes(baseTime.getMinutes() - (count - i) * 2); // Simulate time difference
      const timestamp = baseTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const date = baseTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      let text = '';
      let msgSenderId = i % 2 === 0 ? sender.id : receiver.id;
      let msgSender = i % 2 === 0 ? sender.name : receiver.name;

      if (isGroup && i % 3 === 0) {
        msgSenderId = users[Math.floor(Math.random() * users.length)].id;
        msgSender = users.find(u => u.id === msgSenderId).name;
      }

      switch (i % 10) {
        case 0: text = 'Hey, how are you doing today?'; break;
        case 1: text = 'I\'m good, thanks! Just working on the new feature.'; break;
        case 2: text = 'That sounds interesting. Any updates on the project timeline?'; break;
        case 3: text = 'Yes, the revised timeline is attached. We need to review it by end of day.'; break;
        case 4: text = 'Got it. I\'ll take a look. Let me know if you need any help.'; break;
        case 5: text = 'Thanks! I appreciate that. Also, the client meeting is scheduled for tomorrow.'; break;
        case 6: text = 'Okay, I\'ve marked it in my calendar. Do we need to prepare anything specific?'; break;
        case 7: text = 'Just a brief presentation on the progress. I\'ll share the slides soon.'; break;
        case 8: text = 'Sounds good. Looking forward to it.'; break;
        case 9: text = 'Great. Talk to you later!'; break;
        default: text = 'Hello.';
      }

      msgs.push({
        id: `msg-${Date.now()}-${i}`,
        senderId: msgSenderId,
        senderName: msgSender,
        text: text,
        timestamp: timestamp,
        date: date,
      });
    }
    return msgs;
  };

  const chats = [
    {
      id: 'chat_bhavesh',
      type: 'private',
      name: 'Bhavesh Akhade',
      participants: [currentUser, users.find(u => u.id === 'bhavesh')],
      history: generateMessages(currentUser, users.find(u => u.id === 'bhavesh'), 10),
      isFavorite: true,
    },
    {
      id: 'chat_nikhil',
      type: 'private',
      name: 'Nikhil Soni',
      participants: [currentUser, users.find(u => u.id === 'nikhil')],
      history: generateMessages(currentUser, users.find(u => u.id === 'nikhil'), 8),
      isFavorite: true,
    },
    {
      id: 'chat_ayushb',
      type: 'private',
      name: 'Ayush Bhavesh, Nikhil, +2',
      participants: [currentUser, users.find(u => u.id === 'ayushb')],
      history: generateMessages(currentUser, users.find(u => u.id === 'ayushb'), 7),
      isFavorite: true,
    },
    {
      id: 'chat_ayushm',
      type: 'private',
      name: 'Ayush Michael',
      participants: [currentUser, users.find(u => u.id === 'ayushm')],
      history: generateMessages(currentUser, users.find(u => u.id === 'ayushm'), 12),
      isFavorite: false,
    },
    {
      id: 'chat_prateek',
      type: 'private',
      name: 'Prateek Audichya',
      participants: [currentUser, users.find(u => u.id === 'prateek')],
      history: generateMessages(currentUser, users.find(u => u.id === 'prateek'), 5),
      isFavorite: false,
    },
    {
      id: 'chat_anuj',
      type: 'private',
      name: 'Anuj Srivastava',
      participants: [currentUser, users.find(u => u.id === 'anuj')],
      history: generateMessages(currentUser, users.find(u => u.id === 'anuj'), 9),
      isFavorite: false,
    },
    {
      id: 'channel_atlantick_solutions',
      type: 'channel',
      name: 'Atlantick Solutions',
      participants: [currentUser, ...users],
      history: generateMessages(currentUser, users[0], 20, true),
      isFavorite: false,
    },
    {
      id: 'channel_general',
      type: 'channel',
      name: 'General',
      participants: [currentUser, ...users],
      history: generateMessages(currentUser, users[1], 15, true),
      isFavorite: false,
    },
  ];

  // Set lastMessage and lastReadMessageId for each chat
  chats.forEach(chat => {
    if (chat.history.length > 0) {
      chat.lastMessage = chat.history[chat.history.length - 1];
      chat.lastReadMessageId = chat.history[chat.history.length - 4]?.id; // Simulate a few unread messages
    }
  });

  return { chats, users, currentUser };
};

// --- App Component ---
const Messaging = () => {
  const [activeView, setActiveView] = useState('chat');
  const [data, setData] = useState({ chats: [], users: [], currentUser: null });
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const dummyData = generateDummyData();
    setData(dummyData);
    if (dummyData.chats.length > 0) {
      setSelectedChat(dummyData.chats[0]);
    }
  }, []);

  const getUserById = (id) => {
    return data.users.find(u => u.id === id);
  };

  const addMessageToChat = (chatId, message) => {
    setData(prevData => {
      const updatedChats = prevData.chats.map(chat => {
        if (chat.id === chatId) {
          const newHistory = [...chat.history, message];
          return {
            ...chat,
            history: newHistory,
            lastMessage: message,
            // Optionally clear lastReadMessageId on new message from current user
            lastReadMessageId: message.senderId === prevData.currentUser.id ? message.id : chat.lastReadMessageId,
          };
        }
        return chat;
      });
      return { ...prevData, chats: updatedChats };
    });
    // Ensure selected chat state also updates for immediate UI refresh
    if (selectedChat && selectedChat.id === chatId) {
      setSelectedChat(prevChat => ({
        ...prevChat,
        history: [...prevChat.history, message],
        lastMessage: message,
      }));
    }
  };


  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      {/* Left Sidebar */}
      <SideBar activeView={activeView} setActiveView={setActiveView} currentUser={data.currentUser} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-800 rounded-lg shadow-2xl m-4 overflow-hidden">
        {/* Top Header Bar (Global search, status, settings) */}
        <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center space-x-4">
            {/* User status dropdown - dummy */}
            <div className="relative group">
              <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-700 p-2 rounded-md">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-gray-800"></div>
                <span>Available</span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              {/* Dropdown content can go here */}
            </div>
            {/* Search Bar */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search (Ctrl+E)"
                className="w-80 pl-9 pr-3 py-1.5 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-100 placeholder-gray-400"
              />
              <svg className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          {/* Right section of header (dummy icons) */}
          <div className="flex items-center space-x-4 text-gray-400">
            <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
            <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2m0 0V9a2 2 0 012-2h2m2 4H9m7-4h4a2 2 0 012 2v2M8 12h8m-8-4h8m-8 8h8M3 21h18a2 2 0 002-2V3a2 2 0 00-2-2H3a2 2 0 00-2 2v16a2 2 0 002 2z" /></svg></button>
            <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 12h-2.75a1 1 0 01-1-1v-1.25c0-2.485-2.015-4.5-4.5-4.5s-4.5 2.015-4.5 4.5V21c0 .55.45 1 1 1H3a1 1 0 01-1-1v-2a1 1 0 011-1h18a1 1 0 011 1v2a1 1 0 01-1 1z" /></svg></button>
            <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 100-2 1 1 0 000 2zm0 7a1 1 0 100-2 1 1 0 000 2zm0 7a1 1 0 100-2 1 1 0 000 2z" /></svg></button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'chat' && data.currentUser && (
            <ChatSection
              chats={data.chats}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              getUserById={getUserById}
              currentUser={data.currentUser}
              addMessageToChat={addMessageToChat}
            />
          )}
          {activeView !== 'chat' && (
            <GenericContent activeView={activeView} />
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sidebar Component ---
const SideBar = ({ activeView, setActiveView, currentUser }) => {
  const navItems = [
    { name: 'Activity', icon: '⚡', view: 'activity' },
    { name: 'Chat', icon: '💬', view: 'chat' },
    { name: 'Teams', icon: '👥', view: 'teams' },
    { name: 'Calendar', icon: '📅', view: 'calendar' },
    { name: 'Calls', icon: '📞', view: 'calls' },
    { name: 'Files', icon: '📁', view: 'files' },
    { name: 'Apps', icon: '🧩', view: 'apps' },
    { name: 'Help', icon: '❓', view: 'help' },
  ];

  return (
    <div className="w-20 bg-gray-950 text-gray-300 flex flex-col items-center py-4 rounded-lg shadow-inner m-4">
      <div className="mb-6 p-2">
        <span className="text-3xl font-bold text-purple-400">T</span> {/* Teams-like logo */}
      </div>
      <nav className="flex flex-col space-y-4 flex-grow">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200
              ${activeView === item.view ? 'bg-purple-700 text-white shadow-md' : 'hover:bg-gray-800 hover:text-white'}`}
            onClick={() => setActiveView(item.view)}
          >
            <span className="text-2xl">{item.icon}</span> {/* Using emojis for simplicity */}
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        ))}
      </nav>
      {/* User Profile / Settings */}
      <div className="mt-auto pt-4 border-t border-gray-700 w-full flex justify-center">
        {currentUser && (
          <div className="relative group cursor-pointer">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border-2 border-purple-500 object-cover shadow-lg"
            />
            {/* Tooltip or status indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border border-gray-950"></div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Chat Section Component (Combines ChatList and ChatWindow) ---
const ChatSection = ({ chats, selectedChat, setSelectedChat, getUserById, currentUser, addMessageToChat }) => {
  const favoriteChats = chats.filter(chat => chat.isFavorite);
  const otherChats = chats.filter(chat => !chat.isFavorite && chat.type === 'private');
  const channels = chats.filter(chat => chat.type === 'channel');

  return (
    <div className="flex w-full h-full">
      {/* Chat List Panel */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col p-4">
        {/* Chat List Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Chat</h2>
          <button className="p-1 rounded-full hover:bg-gray-700 text-gray-400 transition-colors duration-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12A9 9 0 113 12a9 9 0 0118 0z" /></svg>
          </button>
        </div>

        {/* Chat Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search chat"
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-100 placeholder-gray-400"
          />
          <svg className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 text-sm mb-4 border-b border-gray-700 pb-3 -mx-4 px-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['Unread', 'Channels', 'Chats', 'Meeting chats'].map(filter => (
            <button key={filter} className={`py-1 px-3 rounded-full text-gray-300 transition-colors duration-200
              ${filter === 'Chats' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}>
              {filter}
            </button>
          ))}
        </div>

        {/* Chat List (Favorites) */}
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pr-2 -mr-2">
          {favoriteChats.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center text-gray-400 text-sm mb-2">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.329 1.258l1.519 4.674c.3.921-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.258 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.329-1.258l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z" /></svg>
                <span>Favorites</span>
              </div>
              {favoriteChats.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => setSelectedChat(chat)}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}

          {otherChats.length > 0 && (
            <div className="mb-4">
              <h3 className="text-gray-400 text-sm mb-2">Chats</h3>
              {otherChats.map(chat => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => setSelectedChat(chat)}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}

          {channels.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-gray-400 text-sm mb-2">
                <h3>Teams and channels</h3>
                <button className="text-gray-400 hover:text-white p-1 rounded-md"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12A9 9 0 113 12a9 9 0 0118 0z" /></svg></button>
              </div>
              {channels.map(channel => (
                <ChatListItem
                  key={channel.id}
                  chat={channel}
                  isSelected={selectedChat?.id === channel.id}
                  onClick={() => setSelectedChat(channel)}
                  currentUser={currentUser}
                />
              ))}
              <button className="text-purple-400 text-sm mt-3 hover:underline">See all your teams</button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-850 rounded-r-lg">
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            getUserById={getUserById}
            currentUser={currentUser}
            addMessageToChat={addMessageToChat}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg">
            <span className="text-5xl mr-4">💬</span>Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

// --- Chat List Item Component ---
const ChatListItem = ({ chat, isSelected, onClick, currentUser }) => {
  const otherParticipant = chat.type === 'private' ? chat.participants.find(p => p.id !== currentUser.id) : null;
  const avatar = otherParticipant ? otherParticipant.avatar : `https://placehold.co/40x40/4F46E5/FFFFFF?text=${chat.name.split(' ').map(n => n[0]).join('')}`;
  const unreadCount = chat.lastReadMessageId ? chat.history.findIndex(msg => msg.id === chat.lastReadMessageId) < chat.history.length -1 ? chat.history.length -1 - chat.history.findIndex(msg => msg.id === chat.lastReadMessageId) : 0 : chat.history.length > 0 ? 1 : 0; // Simple unread logic

  return (
    <button
      className={`flex items-center w-full text-left p-3 rounded-lg cursor-pointer mb-1 transition-colors duration-200 relative
        ${isSelected ? 'bg-gray-700 text-white shadow-inner' : 'hover:bg-gray-700 hover:text-white'}`}
      onClick={onClick}
    >
      <div className="relative w-10 h-10 rounded-full flex-shrink-0 mr-3 overflow-hidden">
        <img
          src={avatar}
          alt={chat.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/40x40/4F46E5/FFFFFF?text=${chat.name.substring(0,2)}` }}
        />
        {otherParticipant && (
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-gray-800 ${
            otherParticipant.status === 'Available' ? 'bg-green-500' :
            otherParticipant.status === 'Busy' ? 'bg-red-500' :
            otherParticipant.status === 'Away' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`}></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-100 truncate">{chat.name}</div>
        <div className={`text-sm text-gray-400 truncate ${unreadCount > 0 ? 'font-semibold text-gray-100' : ''}`}>
          {chat.lastMessage ? chat.lastMessage.text : 'No messages yet'}
        </div>
      </div>
      <div className="flex flex-col items-end ml-2 text-xs text-gray-400">
        {chat.lastMessage ? chat.lastMessage.timestamp : ''}
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mt-1">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

// --- Chat Window Component ---
const ChatWindow = ({ chat, getUserById, currentUser, addMessageToChat }) => {
  const messagesEndRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.history]); // Scroll when history changes

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    addMessageToChat(chat.id, newMsg);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  let lastDate = null;

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-gray-850 p-4 border-b border-gray-700 flex items-center justify-between z-10 shadow-lg">
        <div>
          <h3 className="text-xl font-semibold text-gray-100">{chat.name}</h3>
          {chat.type === 'private' ? (
            <p className="text-sm text-gray-400">{chat.participants.find(p => p.id !== currentUser.id)?.status}</p>
          ) : (
            <p className="text-sm text-gray-400">{chat.participants.length} members</p>
          )}
        </div>
        <div className="flex items-center space-x-3 text-gray-400">
          <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
          <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
          <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12A9 9 0 113 12a9 9 0 0118 0z" /></svg></button>
          <button className="p-2 hover:bg-gray-700 rounded-md transition-colors duration-200"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 100-2 1 1 0 000 2zm0 7a1 1 0 100-2 1 1 0 000 2zm0 7a1 1 0 100-2 1 1 0 000 2z" /></svg></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {chat.history.map((message, index) => {
          const sender = getUserById(message.senderId);
          const isCurrentUser = message.senderId === currentUser.id;

          const showDateSeparator = message.date !== lastDate;
          if (showDateSeparator) lastDate = message.date;

          const isLastRead = chat.lastReadMessageId === message.id;

          return (
            <React.Fragment key={message.id}>
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">{message.date}</span>
                </div>
              )}
              <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}>
                {!isCurrentUser && sender && (
                  <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden mr-2 self-start mt-1">
                    <img
                      src={sender.avatar}
                      alt={sender.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/40x40/6366F1/FFFFFF?text=${sender.name.substring(0,2)}` }}
                    />
                  </div>
                )}
                <div className="flex flex-col max-w-xs md:max-w-md">
                  {!isCurrentUser && <div className="text-xs font-semibold mb-0.5 text-gray-300">{sender?.name}</div>}
                  <div
                    className={`relative p-3 rounded-lg shadow-md break-words text-sm
                      ${isCurrentUser ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}
                  >
                    <p>{message.text}</p>
                    <span className={`absolute bottom-1 right-2 text-xs opacity-70 ${isCurrentUser ? 'text-purple-200' : 'text-gray-400'}`} style={{fontSize: '0.6rem'}}>
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              </div>
              {isLastRead && (
                <div className="flex justify-center items-center my-2">
                  <hr className="flex-grow border-t border-purple-500" />
                  <span className="px-3 text-purple-400 text-xs font-medium">Last read</span>
                  <hr className="flex-grow border-t border-purple-500" />
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-gray-850 p-4 border-t border-gray-700 flex flex-col rounded-b-lg">
        <div className="flex items-center space-x-2 text-gray-400 mb-2">
          <button className="p-1 hover:bg-gray-700 rounded-md transition-colors duration-200" title="Format"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M16 16h.01" /></svg></button>
          <button className="p-1 hover:bg-gray-700 rounded-md transition-colors duration-200" title="Attach"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13.5" /></svg></button>
          <button className="p-1 hover:bg-gray-700 rounded-md transition-colors duration-200" title="Emoji"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          <button className="p-1 hover:bg-gray-700 rounded-md transition-colors duration-200" title="Meeting (dummy)"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
          <button className="p-1 hover:bg-gray-700 rounded-md transition-colors duration-200" title="More options (dummy)"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 100-2 1 1 0 000 2zm0 7a1 1 0 100-2 1 1 0 000 2zm0 7a1 1 0 100-2 1 1 0 000 2z" /></svg></button>
        </div>
        <div className="flex items-center">
          <textarea
            className="flex-1 resize-none border border-gray-600 rounded-md p-2 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm overflow-hidden"
            rows="1"
            placeholder="Type a new message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              e.target.style.height = 'auto'; // Reset height
              e.target.style.height = (e.target.scrollHeight) + 'px'; // Set to scroll height
            }}
            onKeyPress={handleKeyPress}
            style={{ maxHeight: '100px' }} // Limit textarea height
          ></textarea>
          <button
            className="ml-3 px-4 py-2 bg-purple-600 text-white rounded-md shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
            onClick={handleSendMessage}
            disabled={newMessage.trim() === ''}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Generic Content Component (for non-chat views) ---
const GenericContent = ({ activeView }) => {
  const contentMap = {
    activity: { title: 'Activity', icon: '⚡', description: 'No recent activity to display.' },
    teams: { title: 'Teams', icon: '👥', description: 'Explore your teams and channels here.' },
    calendar: { title: 'Calendar', icon: '📅', description: 'View your upcoming meetings and events.' },
    calls: { title: 'Calls', icon: '📞', description: 'Initiate or review your calls history.' },
    files: { title: 'Files', icon: '📁', description: 'Access files shared across your teams and chats.' },
    apps: { title: 'Apps', icon: '🧩', description: 'Discover and manage applications for Teams.' },
    help: { title: 'Help', icon: '❓', description: 'Find help and support for using Teams.' },
  };

  const { title, icon, description } = contentMap[activeView] || {};

  return (
    <div className="flex flex-col flex-1 p-6 bg-gray-850 rounded-b-lg justify-center items-center text-gray-400">
      <span className="text-6xl mb-4">{icon}</span>
      <h2 className="text-2xl font-semibold text-gray-100 mb-2">{title}</h2>
      <p className="text-lg text-gray-500">{description}</p>
      <p className="text-sm mt-2">This is a placeholder. Functionality for this section is not implemented in this demo.</p>
    </div>
  );
};

export default Messaging;