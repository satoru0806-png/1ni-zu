package com.speaknote.ime.voice

sealed class VoiceState {
    data object Idle : VoiceState()
    data class Recording(val interim: String = "") : VoiceState()
    data object Processing : VoiceState()
    data class Done(val text: String, val rawText: String = "") : VoiceState()
    data class Error(val message: String) : VoiceState()
}
