<template>
  <div class="home-grid">
    <h1
      style="
        grid-column: 1 / -1;
        text-align: center;
        font-size: 2em;
        margin-bottom: 20px;
        color: white;
      "
    >
      Welcome to PrivShare, the private file sharing solution without any
      central server!
    </h1>
    <div class="button-group">
      <router-link to="/download">
        <button>Download</button>
      </router-link>
      <router-link to="/upload">
        <button>Upload</button>
      </router-link>
    </div>
  </div>
</template>
