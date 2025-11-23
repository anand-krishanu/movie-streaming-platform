import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  /**
   * Connect to WebSocket server
   */
  connect(onConnectCallback, onErrorCallback) {
    if (this.connected) {
      console.log('WebSocket already connected');
      onConnectCallback?.();
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      
      connectHeaders: {
        // Add auth headers if needed
      },
      
      debug: (str) => {
        console.log('STOMP: ' + str);
      },
      
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: (frame) => {
        console.log('WebSocket Connected:', frame);
        this.connected = true;
        onConnectCallback?.();
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        onErrorCallback?.(frame);
      },
      
      onWebSocketClose: () => {
        console.log('WebSocket connection closed');
        this.connected = false;
      },
      
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.connected = false;
      }
    });

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.client) {
      // Unsubscribe from all subscriptions
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      this.client.deactivate();
      this.connected = false;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(destination, callback, subscriptionId = null) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected. Cannot subscribe to:', destination);
      return null;
    }

    const id = subscriptionId || destination;
    
    // Unsubscribe if already subscribed
    if (this.subscriptions.has(id)) {
      this.subscriptions.get(id).unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (error) {
        console.error('Error parsing message:', error);
        callback(message.body);
      }
    });

    this.subscriptions.set(id, subscription);
    console.log('Subscribed to:', destination);
    
    return subscription;
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(subscriptionId) {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.get(subscriptionId).unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log('Unsubscribed from:', subscriptionId);
    }
  }

  /**
   * Send a message to the server
   */
  send(destination, body = {}) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected. Cannot send to:', destination);
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
    
    console.log('Message sent to:', destination, body);
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;
