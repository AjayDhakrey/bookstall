export interface DatabaseStatus {
  mode: 'memory' | 'supabase';
  persistent: boolean;
}
