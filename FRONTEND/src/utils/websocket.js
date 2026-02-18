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
      onConnectCallback?.();
      return;
    }

    this.client = new Client({
      webSocketFactory: () => {
        const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';
        return new SockJS(wsUrl);
      },
      
      connectHeaders: {
        // Add auth headers if needed
      },
      
      debug: () => {},
      
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        this.connected = true;
        onConnectCallback?.();
      },
      
      onStompError: (frame) => {
        this.connected = false;
        onErrorCallback?.(frame);
      },
      
      onWebSocketClose: () => {
        this.connected = false;
      },
      
      onDisconnect: () => {
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
    }
  }

  /**
   * Subscribe to a topic
   */
  subscribe(destination, callback, subscriptionId = null) {
    if (!this.client || !this.connected) {
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
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        callback(message.body);
      }
    });

    this.subscriptions.set(id, subscription);
    
    return subscription;
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(subscriptionId) {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.get(subscriptionId).unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Send a message to the server
   */
  send(destination, body = {}) {
    if (!this.client || !this.connected) {
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
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
