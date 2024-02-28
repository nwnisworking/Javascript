class Peer extends EventTarget{
      rtc

      channels = []

      constructor(){
        super()
        this.rtc = new RTCPeerConnection
        this.rtc.ondatachannel = e=>this.channels.push(e.channel)
      }

      /**
       * Create a data channel
       * @param {string} name
       * @param {RTCDataChannelInit} option
       */
      createChannel(name, option = {}){
        this.channels.push(this.rtc.createDataChannel(name, option))
        return this
      }

      /**
       * Generate a user offer with local candidates
       * @param {RTCOfferOptions} option
       */
      offer(option){
        return new Promise(res=>{
          this.rtc.createOffer(option).then(async offer=>{
            this.rtc.setLocalDescription(offer)
            res({...offer.toJSON(), candidates : await this.#candidates()})
          })
        })
      }

      /**
       * Generate a user answer along with local candidates after the offer
       * @param {object} offer
       * @param {'offer'|'answer'} offer.type
       * @param {string} offer.sdp
       * @param {RTCIceCandidate[]} offer.candidates
       * @param {RTCAnswerOptions} option
       */
      answer(offer, option){
        return new Promise(res=>{
          this.rtc.setRemoteDescription(offer)
          this.#addCandidates(offer.candidates)
          this.rtc.createAnswer(option).then(async answer=>{
            this.rtc.setLocalDescription(answer)
            res({...answer.toJSON(), candidates : await this.#candidates()})
          })
        })
      }

      /**
       * Finish connection establishment from the answer
       */
      finish(answer){
        this.rtc.setRemoteDescription(answer)
        this.#addCandidates(answer.candidates)
      }

      /**
       * Add candidates to the RTC
       * @param {RTCIceCandidate[]} candidates
       */
      #addCandidates(candidates){
        candidates.forEach((e, i)=>{
          if(i === 0){
            console.log(e.address)
            this.rtc.addIceCandidate(e)
          }
        })
      }

      /**
       * Gather potential candidates
       */
      async #candidates(){
        return new Promise((res)=>{
          const candidates = []
          this.rtc.onicecandidate = ({candidate})=>candidate ? candidates.push(candidate) : null
          this.rtc.onicegatheringstatechange = ()=>this.rtc.iceGatheringState === 'complete' ? res(candidates) : null
        })
      }
    }
