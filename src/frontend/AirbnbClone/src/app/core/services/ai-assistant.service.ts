import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

export interface DescriptionRequest {
  title: string;
  location: string;
  propertyType: string;
  amenities: string[];
}

export interface DescriptionResponse {
  count: number;
  generatedDescriptions: string[];
}

export interface ChatMessageDto {
  role: string; // "user" or "assistant"
  content: string;
}

export interface ChatRequest {
  question: string;
  history: ChatMessageDto[];
}

export interface ChatResponse {
  question: string;
  answer: string;
  sourceUsed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  private apiUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  generateDescriptions(data: DescriptionRequest): Observable<DescriptionResponse> {
    return this.http.post<DescriptionResponse>(`${this.apiUrl}descriptions/generate`, data);
  }

  askBot(question: string, history: ChatMessageDto[] = []): Observable<ChatResponse> {
    // Note: Based on your logs, your controller route is "aichat/ask"
    const headers = new HttpHeaders().set('X-Skip-Loader', 'true');
    const payload: ChatRequest = { question, history };
    return this.http.post<ChatResponse>(`${this.apiUrl}aichat/ask`, payload, { headers });
  }
}
