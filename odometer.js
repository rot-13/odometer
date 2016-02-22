function ScrollingDigit(container, rolloverListener, id, minVelocity, maxVelocity, velocityMultiplier) {
  this.container = container;
  this.rolloverListener = rolloverListener;
  this.id = id;
  this.minVelocity = minVelocity;
  this.maxVelocity = maxVelocity;
  this.velocityMultiplier = velocityMultiplier;

  this.target = null;
  this.currentValue = 0;
  this.animating = false;
  this.lastFrameTime = 0;

  var digitPrototype = document.createElement("DIV");
  digitPrototype.classList.add("odometer_digit");
  this.currentDigit = digitPrototype.cloneNode();
  this.nextDigit = digitPrototype.cloneNode();
  this.container.appendChild(this.currentDigit);
  this.container.appendChild(this.nextDigit);
}

ScrollingDigit.prototype.setTarget = function(target) {
  if (this.target === null) {
    this.target = target;
    this.currentValue = target;
    this.drawFrame();
  } else {
    this.target = target;
    this.startAnimating();
  }
};

ScrollingDigit.prototype.update = function(dt) {
  if (this.target !== null && this.target != this.currentValue) {
    var velocity = this.target - this.currentValue;
    velocity *= this.velocityMultiplier;
    velocity = Math.min(Math.max(this.minVelocity, velocity), this.maxVelocity);
    var advance = velocity * dt;

    var valueBefore = this.currentValue;

    if (this.target - this.currentValue < advance) {
      advance = this.target - this.currentValue;
      this.currentValue = this.target;
    } else {
      this.currentValue += advance;
    }

    var rolloverCount = Math.floor((((valueBefore+0.999) % 10) + advance) / 10);
    if (rolloverCount > 0) {
      this.rolloverListener(this.id, rolloverCount);
    }

    this.drawFrame();
  }
};

ScrollingDigit.prototype.drawFrame = function() {
  var intValue = Math.floor(this.currentValue);
  this.currentDigit.textContent = (intValue === 0 ? " " : intValue % 10);
  this.nextDigit.textContent = (intValue+1 === 0 ? " " : (intValue + 1) % 10);
  this.currentDigit.style.bottom = ((this.currentValue % 1) * 100) + "%";
  this.nextDigit.style.bottom = ((this.currentValue % 1) * 100 - 100) + "%";
};

ScrollingDigit.prototype.doFrame = function() {
  var now = Date.now();
  var dt = (now - this.lastFrameTime) / 1000;
  this.lastFrameTime = now;

  this.update(dt);

  if (true || this.currentValue != this.target) {
    requestAnimationFrame(this.doFrame.bind(this));
  } else {
    this.animating = false;
  }
};

ScrollingDigit.prototype.startAnimating = function() {
  if (!this.animating) {
    this.animating = true;
    this.lastFrameTime = Date.now();
    requestAnimationFrame(this.doFrame.bind(this));
  }
};

function Odometer(container, minVelocity, maxVelocity, velocityMultiplier) {
  this.container = container;
  this.minVelocity = minVelocity || 1;
  this.maxVelocity = maxVelocity || 1000000;
  this.velocityMultiplier = velocityMultiplier || 8;
  this.animating = false;
  this.digitSlotPrototype = document.createElement("SPAN");
  this.digitSlotPrototype.classList.add("odometer_digit_slot");
  this.scrollingDigits = [];
  this.initialized = false;
  this.lastTarget = 0;
}

Odometer.prototype.setTarget = function(target) {
  target = parseInt(target);

  if (!this.initialized || this.lastTarget > target) {
    this.init(target);
  } else {
    this.scrollingDigits[0].setTarget(target);
  }
  this.lastTarget = target;
};

Odometer.prototype.init = function(target) {
  this.container.innerHTML = "";
  this.scrollingDigits = [];

  var numDigits = (target == 0 ? 1 : Math.floor(Math.log(Math.abs(target)) / Math.LN10));
  for (var i = 0; i <= numDigits; ++i) {
    if (i > 0 && i % 3 == 0) {
      var comma = document.createElement("SPAN");
      comma.classList.add("odometer_comma_slot");
      comma.textContent = ",";
      this.container.insertBefore(comma, this.container.childNodes[0]);
    }
    var digitSlot = this.digitSlotPrototype.cloneNode();
    var scrollingDigit = new ScrollingDigit(digitSlot, this.rollover.bind(this), i, this.minVelocity, this.maxVelocity, this.velocityMultiplier);
    this.scrollingDigits.push(scrollingDigit);
    this.container.insertBefore(digitSlot, this.container.childNodes[0]);
  }

  for (var i = 0; i < this.scrollingDigits.length; ++i) {
    this.scrollingDigits[i].setTarget(Math.floor(target/Math.pow(10, i)));
  }

  this.initialized = true;
};

Odometer.prototype.rollover = function(id, amount) {
  if (id + 1 < this.scrollingDigits.length) {
    this.scrollingDigits[id+1].setTarget(this.scrollingDigits[id+1].target + amount);
  } else {
    if (this.scrollingDigits.length % 3 == 0) {
      var comma = document.createElement("SPAN");
      comma.classList.add("odometer_comma_slot");
      comma.textContent = ",";
      this.container.insertBefore(comma, this.container.childNodes[0]);
    }
    var digitSlot = this.digitSlotPrototype.cloneNode();
    var scrollingDigit = new ScrollingDigit(digitSlot, this.rollover.bind(this), this.scrollingDigits.length, this.minVelocity, this.maxVelocity, this.velocityMultiplier);
    scrollingDigit.setTarget(0);
    scrollingDigit.setTarget(amount);
    this.scrollingDigits.push(scrollingDigit);
    this.container.insertBefore(digitSlot, this.container.childNodes[0]);
  }
};

if (typeof module === 'object' && module.exports) {
  module.exports = Odometer;
}
