package com.speaknote.ime.service

import android.inputmethodservice.InputMethodService
import android.media.AudioManager
import android.media.ToneGenerator
import android.view.View
import android.view.inputmethod.EditorInfo
import com.speaknote.ime.input.ConversionManager
import com.speaknote.ime.input.InputCommitManager
import com.speaknote.ime.keyboard.KeyboardMode
import com.speaknote.ime.ui.KeyboardPanel
import com.speaknote.ime.voice.VoiceRecorderController
import com.speaknote.ime.voice.VoiceState
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collectLatest

class SpeakNoteInputMethodService : InputMethodService() {

    private lateinit var keyboardPanel: KeyboardPanel
    private lateinit var inputManager: InputCommitManager
    private lateinit var voiceController: VoiceRecorderController
    private lateinit var conversionManager: ConversionManager
    private var toneGenerator: ToneGenerator? = null

    // Composing buffer for conversion
    private val composingBuffer = StringBuilder()
    private var isComposing = false

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    override fun onCreateInputView(): View {
        keyboardPanel = KeyboardPanel(this)
        inputManager = InputCommitManager(this)
        voiceController = VoiceRecorderController(this)
        conversionManager = ConversionManager(this)

        // Keyboard key tap handler
        keyboardPanel.onKeyTap = { key ->
            handleKeyTap(key)
        }

        // Mic button handler
        keyboardPanel.onMicTap = {
            toggleVoice()
        }

        // Convert button handler
        keyboardPanel.onConvertTap = {
            convertComposingText()
        }

        // Candidate selection handler
        keyboardPanel.onCandidateSelected = { candidate ->
            commitCandidate(candidate)
        }

        // Observe voice state changes
        serviceScope.launch {
            voiceController.state.collectLatest { state ->
                handleVoiceState(state)
            }
        }

        return keyboardPanel
    }

    private fun handleKeyTap(key: String) {
        when (key) {
            "DEL" -> {
                if (isComposing && composingBuffer.isNotEmpty()) {
                    composingBuffer.deleteCharAt(composingBuffer.length - 1)
                    if (composingBuffer.isEmpty()) {
                        finishComposing()
                    } else {
                        updateComposingDisplay()
                    }
                } else {
                    finishComposing()
                    inputManager.deleteBackward()
                }
                keyboardPanel.hideCandidates()
            }
            "ENTER" -> {
                if (isComposing) {
                    // Commit composing text as-is
                    val text = composingBuffer.toString()
                    finishComposing()
                    inputManager.commitText(text)
                } else {
                    inputManager.sendEnter()
                }
                keyboardPanel.hideCandidates()
            }
            "SPACE" -> {
                if (isComposing) {
                    // Space during composing = convert
                    convertComposingText()
                } else {
                    inputManager.commitText(" ")
                }
            }
            "゛゜" -> {
                if (isComposing && composingBuffer.isNotEmpty()) {
                    // Apply dakuten to last char in buffer
                    val last = composingBuffer.last()
                    val converted = getDakuten(last)
                    if (converted != null) {
                        composingBuffer.deleteCharAt(composingBuffer.length - 1)
                        composingBuffer.append(converted)
                        updateComposingDisplay()
                    }
                } else {
                    inputManager.toggleDakuten()
                }
            }
            "⇧" -> {}
            "MODE_ABC" -> keyboardPanel.switchMode(KeyboardMode.ALPHABET)
            "MODE_123" -> keyboardPanel.switchMode(KeyboardMode.NUMBER)
            "MODE_HIRA" -> keyboardPanel.switchMode(KeyboardMode.HIRAGANA)
            else -> {
                // Regular character input
                if (isHiragana(key)) {
                    // Add to composing buffer
                    composingBuffer.append(key)
                    isComposing = true
                    updateComposingDisplay()
                } else {
                    // Non-hiragana: commit composing first, then input
                    if (isComposing) {
                        val text = composingBuffer.toString()
                        finishComposing()
                        inputManager.commitText(text)
                    }
                    inputManager.commitText(key)
                }
            }
        }
    }

    private fun updateComposingDisplay() {
        val ic = currentInputConnection ?: return
        ic.setComposingText(composingBuffer.toString(), 1)
    }

    private fun finishComposing() {
        composingBuffer.clear()
        isComposing = false
        currentInputConnection?.finishComposingText()
    }

    private fun convertComposingText() {
        if (!isComposing || composingBuffer.isEmpty()) {
            // Try to convert text before cursor
            val ic = currentInputConnection ?: return
            val before = ic.getTextBeforeCursor(20, 0)?.toString() ?: return
            if (before.isEmpty()) return

            // Find the last hiragana segment
            val hiragana = extractLastHiragana(before)
            if (hiragana.isEmpty()) return

            // Delete the hiragana and set as composing
            ic.deleteSurroundingText(hiragana.length, 0)
            composingBuffer.clear()
            composingBuffer.append(hiragana)
            isComposing = true
            updateComposingDisplay()
        }

        val text = composingBuffer.toString()
        serviceScope.launch {
            val candidates = conversionManager.getCandidates(text)
            keyboardPanel.showCandidates(candidates)
        }
    }

    private fun commitCandidate(candidate: String) {
        val original = composingBuffer.toString()
        finishComposing()
        inputManager.commitText(candidate)
        keyboardPanel.hideCandidates()

        // Learn this conversion
        if (original.isNotEmpty() && candidate != original) {
            conversionManager.learn(original, candidate)
        }
    }

    private fun extractLastHiragana(text: String): String {
        val sb = StringBuilder()
        for (i in text.length - 1 downTo 0) {
            val c = text[i]
            if (c in '\u3040'..'\u309F' || c == 'ー') {
                sb.insert(0, c)
            } else {
                break
            }
        }
        return sb.toString()
    }

    private fun isHiragana(text: String): Boolean {
        return text.all { it in '\u3040'..'\u309F' || it == 'ー' || it == '〜' }
    }

    private fun getDakuten(c: Char): Char? {
        val map = mapOf(
            'か' to 'が', 'が' to 'か', 'き' to 'ぎ', 'ぎ' to 'き',
            'く' to 'ぐ', 'ぐ' to 'く', 'け' to 'げ', 'げ' to 'け',
            'こ' to 'ご', 'ご' to 'こ',
            'さ' to 'ざ', 'ざ' to 'さ', 'し' to 'じ', 'じ' to 'し',
            'す' to 'ず', 'ず' to 'す', 'せ' to 'ぜ', 'ぜ' to 'せ',
            'そ' to 'ぞ', 'ぞ' to 'そ',
            'た' to 'だ', 'だ' to 'た', 'ち' to 'ぢ', 'ぢ' to 'ち',
            'つ' to 'づ', 'づ' to 'つ', 'て' to 'で', 'で' to 'て',
            'と' to 'ど', 'ど' to 'と',
            'は' to 'ば', 'ば' to 'ぱ', 'ぱ' to 'は',
            'ひ' to 'び', 'び' to 'ぴ', 'ぴ' to 'ひ',
            'ふ' to 'ぶ', 'ぶ' to 'ぷ', 'ぷ' to 'ふ',
            'へ' to 'べ', 'べ' to 'ぺ', 'ぺ' to 'へ',
            'ほ' to 'ぼ', 'ぼ' to 'ぽ', 'ぽ' to 'ほ',
            'あ' to 'ぁ', 'ぁ' to 'あ', 'い' to 'ぃ', 'ぃ' to 'い',
            'う' to 'ぅ', 'ぅ' to 'う', 'え' to 'ぇ', 'ぇ' to 'え',
            'お' to 'ぉ', 'ぉ' to 'お',
            'や' to 'ゃ', 'ゃ' to 'や', 'ゆ' to 'ゅ', 'ゅ' to 'ゆ',
            'よ' to 'ょ', 'ょ' to 'よ', 'つ' to 'っ', 'っ' to 'つ',
        )
        return map[c]
    }

    private fun toggleVoice() {
        // Commit any composing text first
        if (isComposing) {
            val text = composingBuffer.toString()
            finishComposing()
            inputManager.commitText(text)
            keyboardPanel.hideCandidates()
        }

        val current = voiceController.state.value
        if (current is VoiceState.Recording) {
            voiceController.stopRecording()
        } else if (current is VoiceState.Idle || current is VoiceState.Error) {
            voiceController.startRecording()
        }
    }

    private fun handleVoiceState(state: VoiceState) {
        when (state) {
            is VoiceState.Idle -> {
                keyboardPanel.showStatus("マイクをタップして音声入力")
                keyboardPanel.setMicState(false)
            }
            is VoiceState.Recording -> {
                keyboardPanel.showStatus("録音中... ${state.interim}")
                keyboardPanel.setMicState(true)
            }
            is VoiceState.Processing -> {
                keyboardPanel.showStatus("処理中...")
            }
            is VoiceState.Done -> {
                inputManager.commitText(state.text)
                playDoneTone()
                keyboardPanel.showStatus("入力完了")
                keyboardPanel.setMicState(false)
                serviceScope.launch {
                    delay(1000)
                    voiceController.resetToIdle()
                }
            }
            is VoiceState.Error -> {
                keyboardPanel.showStatus("エラー: ${state.message}")
                keyboardPanel.setMicState(false)
                serviceScope.launch {
                    delay(2000)
                    voiceController.resetToIdle()
                }
            }
        }
    }

    override fun onStartInput(attribute: EditorInfo?, restarting: Boolean) {
        super.onStartInput(attribute, restarting)
        // Reset composing state when switching input fields
        composingBuffer.clear()
        isComposing = false
    }

    private fun playDoneTone() {
        try {
            toneGenerator?.release()
            toneGenerator = ToneGenerator(AudioManager.STREAM_SYSTEM, ToneGenerator.MAX_VOLUME)
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 150)
        } catch (_: Exception) {
            try {
                val tg = ToneGenerator(AudioManager.STREAM_NOTIFICATION, ToneGenerator.MAX_VOLUME)
                tg.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 150)
                tg.release()
            } catch (_: Exception) {}
        }
    }

    override fun onDestroy() {
        serviceScope.cancel()
        voiceController.destroy()
        toneGenerator?.release()
        toneGenerator = null
        super.onDestroy()
    }
}
