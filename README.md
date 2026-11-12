# ЧуЧа — proof of concept

Built output only. This is a Phase-0 prototype for a speech-practice app used
in supervised therapy sessions; it is published here so it can be opened on a
tablet, and for no other reason.

Audio is analysed on the device and discarded: nothing is recorded and no
recording is ever uploaded. The reward video is chosen by the adult from their
own device and never leaves it.

After a session ends, the app sends a short technical journal about **how the
app behaved** — timings, settings as numbers, and coded events such as "a sound
was heard" or "it did not match". It contains no audio, no recording, no
transcript, no target sounds or words, no file names, and no name, code or
diagnosis of a child. There is no field in it that can hold free text. Journals
are deleted automatically after 30 days and are read only to work out why the
app did something.

Source lives in a private repository. Rebuilt and force-pushed by
`scripts/deploy-poc.sh`, so do not edit anything here by hand.
