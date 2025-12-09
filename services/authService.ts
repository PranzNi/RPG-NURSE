
import { Player } from '../types';
import { sql } from './neon';

// In-memory store for the current session's user ID
let currentUserId: number | null = null;

export const authService = {
  register: async (username: string, password: string, displayName: string): Promise<{ success: boolean; message: string; data?: Player | null }> => {
    try {
      // 1. Check if user exists (using username in place of email column)
      const existing = await sql`SELECT id FROM users WHERE email = ${username}`;
      if (existing && existing.length > 0) {
        return { success: false, message: 'User already exists.' };
      }

      // 2. Insert new user
      // MAPPING: We use the 'email' column to store the 'username' to maintain compatibility with the existing DB table.
      await sql`
        INSERT INTO users (email, password, display_name, game_data)
        VALUES (${username}, ${password}, ${displayName}, ${null})
      `;

      return { success: true, message: 'Registration successful! You can now log in.' };
    } catch (e: any) {
      console.error("Registration error:", e);
      return { success: false, message: 'Registration failed: ' + e.message };
    }
  },

  login: async (username: string, password: string): Promise<{ success: boolean; message: string; data?: Player | null; username?: string }> => {
    try {
      // 1. Find user by username (mapped to email column)
      const users = await sql`
        SELECT id, display_name, game_data 
        FROM users 
        WHERE email = ${username} AND password = ${password}
      `;

      if (!users || users.length === 0) {
        return { success: false, message: 'Invalid username or password' };
      }

      const user = users[0];
      
      // Set session ID
      currentUserId = user.id;

      const player: Player | null = user.game_data || null;
      // If display_name is missing, fallback to username
      const display = user.display_name || username;

      return { success: true, message: 'Login successful', data: player, username: display };
    } catch (e: any) {
      console.error("Login error:", e);
      return { success: false, message: 'Login failed: ' + e.message };
    }
  },

  saveProgress: async (playerData: Player) => {
    try {
      if (!currentUserId) {
          console.warn("Cannot save: No active user session.");
          return;
      }

      await sql`
        UPDATE users 
        SET game_data = ${JSON.stringify(playerData)}
        WHERE id = ${currentUserId}
      `;
      
      console.log("Game saved to Neon DB.");
    } catch (e) {
      console.error("Exception saving progress:", e);
    }
  },

  logout: async () => {
    currentUserId = null;
    return Promise.resolve();
  }
};
