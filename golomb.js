export class Golomb{
  /** @type {DataView} */
  dv
  
  /** @type {number} */
  offset = 0

  get byte(){
    return this.offset >>> 3
  }

  get available_bits(){
    return 8 - this.offset % 8
  }

  constructor(dv){
    this.dv = dv
  }

  skipZero(){
    const { byte, dv, offset } = this,
    v = dv.getUint8(byte)
    
    let p, i = p = offset - byte * 8

    for(; i < 8; ++i){
      if((v & (0x80 >>> i)) !== 0){
        this.offset+= i - p
        return i - p
      }
    }

    this.offset+= i - p
    return (i - p) + this.skipZero()
  }

  readBits(size){
    const { byte, dv } = this,
    v = dv.getUint8(byte)

    let { available_bits } = this
    available_bits-= size

    this.offset+= size

    if(available_bits < 0){
      available_bits = Math.abs(available_bits)
      size-= available_bits
  
      this.offset-= available_bits
      /**
       * Since the size went over to the next byte, we will mask the value from the LSB 
       * and shift by how much it overflows then read the next bit based on the overflow length
       */
      return (v & ((1 << size) - 1)) << available_bits | this.readBits(available_bits)
    }
    else{
      return v >>> available_bits & (1 << size) - 1
    }
  }

  getUEG(){
    return this.readBits(this.skipZero() + 1) - 1
  }

  getEG(){
    const v = this.getUEG()

    if(0x1 & v)
      return (i + v) >>> 1
    else
      return -1 * (v >>> 1)
  }

  getUint8(){
    return this.readBits(8)
  }

  getUint16(){
    return this.readBits(16)
  }

  getUint32(){
    return this.readBits(32)
  }
}
