# Anamnesebogen

## Verbesserungen vom 11.11.2026

- Die 26 Aussagen bleiben wortgleich.
- Strenger Textimport mit Duplikaterkennung, Datum und Formularversion.
- Import einzelner JSON-Antworten und vollständiger JSON-Sicherungen; ungültige Dateien werden vollständig abgewiesen.
- Mobile Rückmeldungskarten mit vollständigen Aussagen statt einer 1.050 Pixel breiten Tabelle.
- Einzelne Rückmeldungen löschen, optionale lokale Speicherung, vollständiges Löschen und Druckansicht.
- Einheitliche Bewertungsskala und Navigation zur nächsten offenen Frage.
- Gemeinsames Stylesheet ohne doppelte Designblöcke.

## Tests

`node tests/logic.cjs` prüft Import, Export, Duplikate, Fehlerfälle, Rohsummen, Metadaten, CSV-Escaping, WhatsApp-Text und unveränderte Aussagen gegenüber dem Git-Stand.

`node tests/workflow.cjs` enthält zusätzliche Browserprüfungen. Benötigt Playwright und Chromium (`CHROMIUM_PATH` kann den Browserpfad setzen). Dieser Browserlauf konnte in der Bearbeitungsumgebung wegen gesperrter Browser-Sockets nicht ausgeführt werden. Ein echter iOS-/Android-WhatsApp-Test bleibt erforderlich. Es wird niemals automatisch eine Nachricht gesendet.
