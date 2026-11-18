import torch, torchaudio as ta, sys, time
_ol=torch.load
def _l(*a,**k): k["map_location"]=torch.device("cpu"); return _ol(*a,**k)
torch.load=_l; torch.set_num_threads(6)
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
m=ChatterboxMultilingualTTS.from_pretrained(device=torch.device("cpu"))
T="मेरे गुरुओं ने कहा था, राम आएँगे। आपके लिए मैंने पम्पा के किनारे से, वन के फल इकट्ठा किए हैं।"
for i in range(1,6):
  for k in (1,2):
    torch.manual_seed(77+k); t0=time.time()
    w=m.generate(T,language_id="hi",audio_prompt_path=f"ref{i}.wav",exaggeration=0.6,cfg_weight=0.35,temperature=0.8)
    ta.save(f"opt{i}_t{k}.wav",w,m.sr); print(i,k,round(w.shape[-1]/m.sr,1),"s",round(time.time()-t0),"s",flush=True)
print("AUD_DONE")
