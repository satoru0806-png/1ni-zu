package com.speaknote.ime.voice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class VoiceRecorderController(private val context: Context) {

    private val _state = MutableStateFlow<VoiceState>(VoiceState.Idle)
    val state: StateFlow<VoiceState> = _state

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var retryCount = 0
    private val maxRetry = 2

    // Continuous mode: accumulate text until user stops
    private var isContinuousMode = false
    private val accumulatedText = StringBuilder()

    fun startRecording() {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            _state.value = VoiceState.Error("音声認識が利用できません")
            return
        }

        retryCount = 0
        isContinuousMode = true
        accumulatedText.clear()

        mainHandler.post {
            startRecognizerInternal()
        }
    }

    private fun startRecognizerInternal() {
        try {
            speechRecognizer?.destroy()
            speechRecognizer = null
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context.applicationContext).apply {
                setRecognitionListener(listener)
            }

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ja-JP")
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 10000L)
            }

            speechRecognizer?.startListening(intent)
            if (accumulatedText.isEmpty()) {
                _state.value = VoiceState.Recording()
            } else {
                _state.value = VoiceState.Recording(accumulatedText.toString())
            }
        } catch (e: Exception) {
            _state.value = VoiceState.Error("音声認識の開始に失敗: ${e.message}")
        }
    }

    fun stopRecording() {
        isContinuousMode = false
        mainHandler.post {
            try {
                speechRecognizer?.stopListening()
            } catch (_: Exception) {}

            // If we have accumulated text, emit it as Done
            if (accumulatedText.isNotEmpty()) {
                val finalText = accumulatedText.toString()
                accumulatedText.clear()
                _state.value = VoiceState.Done(text = finalText, rawText = finalText)
            } else {
                _state.value = VoiceState.Idle
            }
        }
    }

    fun resetToIdle() {
        _state.value = VoiceState.Idle
    }

    fun destroy() {
        isContinuousMode = false
        mainHandler.post {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = null
            } catch (_: Exception) {}
        }
    }

    private val listener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
            val display = if (accumulatedText.isEmpty()) "聞いています..." else accumulatedText.toString()
            _state.value = VoiceState.Recording(display)
        }
        override fun onBeginningOfSpeech() {
            val display = if (accumulatedText.isEmpty()) "話してください..." else accumulatedText.toString()
            _state.value = VoiceState.Recording(display)
        }
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}

        override fun onPartialResults(partialResults: Bundle?) {
            val matches = partialResults
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
                val interim = matches[0]
                if (interim.isNotEmpty()) {
                    val display = if (accumulatedText.isEmpty()) interim
                                  else "${accumulatedText}${interim}"
                    _state.value = VoiceState.Recording(display)
                }
            }
        }

        override fun onResults(results: Bundle?) {
            val matches = results
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
                val text = matches[0]
                if (text.isNotEmpty()) {
                    accumulatedText.append(text)
                }
            }

            // If continuous mode, restart listening automatically
            if (isContinuousMode) {
                _state.value = VoiceState.Recording(accumulatedText.toString())
                mainHandler.postDelayed({
                    if (isContinuousMode) {
                        startRecognizerInternal()
                    }
                }, 300)
            } else {
                // Manual stop already happened
                if (accumulatedText.isNotEmpty()) {
                    val finalText = accumulatedText.toString()
                    accumulatedText.clear()
                    _state.value = VoiceState.Done(text = finalText, rawText = finalText)
                } else {
                    _state.value = VoiceState.Error("認識結果なし")
                }
            }
        }

        override fun onError(error: Int) {
            // ERROR_SERVER_DISCONNECTED (11) - auto retry
            if (error == 11 && retryCount < maxRetry) {
                retryCount++
                _state.value = VoiceState.Recording("再接続中...(${retryCount})")
                mainHandler.postDelayed({
                    startRecognizerInternal()
                }, 500)
                return
            }

            // NO_MATCH or SPEECH_TIMEOUT in continuous mode: just restart
            if (isContinuousMode && (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)) {
                val display = if (accumulatedText.isEmpty()) "聞いています..." else accumulatedText.toString()
                _state.value = VoiceState.Recording(display)
                mainHandler.postDelayed({
                    if (isContinuousMode) {
                        startRecognizerInternal()
                    }
                }, 300)
                return
            }

            val message = when (error) {
                SpeechRecognizer.ERROR_NO_MATCH -> "音声が認識できませんでした"
                SpeechRecognizer.ERROR_AUDIO -> "オーディオエラー"
                SpeechRecognizer.ERROR_NETWORK -> "ネットワークエラー"
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "ネットワークタイムアウト"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "マイク権限がありません"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "音声が検出されませんでした"
                SpeechRecognizer.ERROR_CLIENT -> "クライアントエラー"
                SpeechRecognizer.ERROR_SERVER -> "サーバーエラー"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "認識エンジンがビジーです"
                11 -> "サーバー切断 (リトライ上限)"
                else -> "エラー (code: $error)"
            }
            _state.value = VoiceState.Error(message)
        }

        override fun onEvent(eventType: Int, params: Bundle?) {}
    }
}
