import { WebSocket } from "ws";
import { OutgoingResponse } from "../types/responseTypes";

export const WsResponse = {
  error: (ws: WebSocket, message: string): void => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ERROR", msg: message }));
      } else {
        console.warn(
          `Cannot send error message - WebSocket state: ${ws.readyState}. Message: ${message}`
        );
      }
    } catch (error) {
      console.error("Error sending error message via WebSocket:", error);
    }
  },

  info: (ws: WebSocket, message: string): void => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "INFO", msg: message }));
      } else {
        console.warn(
          `Cannot send info message - WebSocket state: ${ws.readyState}. Message: ${message}`
        );
      }
    } catch (error) {
      console.error("Error sending info message via WebSocket:", error);
    }
  },

  success: (ws: WebSocket, message: string): void => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "SUCCESS", msg: message }));
      } else {
        console.warn(
          `Cannot send success message - WebSocket state: ${ws.readyState}. Message: ${message}`
        );
      }
    } catch (error) {
      console.error("Error sending success message via WebSocket:", error);
    }
  },

  custom: (ws: WebSocket, data: OutgoingResponse): void => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      } else {
        console.warn(
          `Cannot send custom message - WebSocket state: ${ws.readyState}. Type: ${data.type}`
        );
      }
    } catch (error) {
      console.error(
        "Error sending custom message via WebSocket:",
        error,
        "Data type:",
        data.type
      );
      // Previously this failed silently, leaving the client waiting forever
      // (e.g. stuck on a loading skeleton with no message ever arriving).
      // Let the client know something went wrong instead of hanging.
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "ERROR",
              msg: `Failed to send ${data.type} response. Please try again.`,
            })
          );
        }
      } catch {
        // If even this fails, there's nothing more we can do.
      }
    }
  },
};
