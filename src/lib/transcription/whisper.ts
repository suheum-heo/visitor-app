/**
 * OpenAI Whisper API 전사 stub.
 * 실제 구현 시 OPENAI_API_KEY 환경변수와 Whisper API를 연동한다.
 */
export async function transcribeRecording(
  _filePath: string,
  _mimeType: string
): Promise<string> {
  // TODO: OpenAI Whisper API 호출 구현
  // 1. R2에서 파일 다운로드 또는 presigned URL 생성
  // 2. POST https://api.openai.com/v1/audio/transcriptions (model: whisper-1)
  // 3. 반환된 텍스트를 meeting_recordings.transcription_text에 저장
  throw new Error('Whisper transcription not implemented yet')
}
