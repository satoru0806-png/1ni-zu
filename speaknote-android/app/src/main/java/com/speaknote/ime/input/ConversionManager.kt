package com.speaknote.ime.input

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Japanese text conversion manager.
 * Uses Google CGI API for hiragana → kanji conversion.
 * Caches user selections for learning.
 */
class ConversionManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("speaknote_conversion", Context.MODE_PRIVATE)

    /**
     * Get conversion candidates for hiragana text.
     * Returns list of candidates (first = learned/preferred).
     */
    suspend fun getCandidates(hiragana: String): List<String> {
        if (hiragana.isBlank()) return emptyList()

        val candidates = mutableListOf<String>()

        // 1. Check learned conversions first
        val learned = prefs.getString("conv_$hiragana", null)
        if (learned != null) {
            candidates.add(learned)
        }

        // 2. Fetch from Google CGI API
        try {
            val apiCandidates = fetchFromGoogle(hiragana)
            for (c in apiCandidates) {
                if (c !in candidates) candidates.add(c)
            }
        } catch (_: Exception) {}

        // 3. Add original hiragana as fallback
        if (hiragana !in candidates) candidates.add(hiragana)

        // 4. Add katakana version
        val katakana = toKatakana(hiragana)
        if (katakana != hiragana && katakana !in candidates) {
            candidates.add(katakana)
        }

        return candidates
    }

    /**
     * Save user's conversion choice for learning.
     */
    fun learn(hiragana: String, selected: String) {
        prefs.edit().putString("conv_$hiragana", selected).apply()
    }

    /**
     * Fetch candidates from Google Japanese Input CGI API.
     */
    private suspend fun fetchFromGoogle(text: String): List<String> = withContext(Dispatchers.IO) {
        val candidates = mutableListOf<String>()
        try {
            val encoded = URLEncoder.encode(text, "UTF-8")
            val url = URL("https://www.google.com/transliterate?langpair=ja-Hira|ja&text=$encoded")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            conn.requestMethod = "GET"

            if (conn.responseCode == 200) {
                val response = conn.inputStream.bufferedReader().readText()
                // Response format: [["hiragana",["candidate1","candidate2",...]]]
                val jsonArray = JSONArray(response)
                for (i in 0 until jsonArray.length()) {
                    val entry = jsonArray.getJSONArray(i)
                    val cands = entry.getJSONArray(1)
                    for (j in 0 until minOf(cands.length(), 8)) {
                        val c = cands.getString(j)
                        if (c.isNotBlank() && c !in candidates) {
                            candidates.add(c)
                        }
                    }
                }
            }
            conn.disconnect()
        } catch (_: Exception) {}
        candidates
    }

    private fun toKatakana(hiragana: String): String {
        return buildString {
            for (c in hiragana) {
                if (c in '\u3041'..'\u3096') {
                    append((c.code + 0x60).toChar())
                } else {
                    append(c)
                }
            }
        }
    }
}
